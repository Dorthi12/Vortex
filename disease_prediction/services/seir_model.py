"""
services/seir_model.py
────────────────────────────────────────────────────────────────
Model 6 — Disease Spread Simulation (SEIR)
Compartments: S → Susceptible, E → Exposed, I → Infected, R → Recovered
dI/dt = βSI - γI (simplified), full model includes σ (incubation rate)
Mobility influence: cross-district infection spread
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ── DISEASE SEIR PARAMETERS ───────────────────────────────────
SEIR_PARAMS = {
    "Malaria":          {"beta": 0.25, "gamma": 0.10, "sigma": 0.12, "R0": 2.5},
    "Dengue":           {"beta": 0.35, "gamma": 0.12, "sigma": 0.14, "R0": 2.9},
    "Typhoid":          {"beta": 0.20, "gamma": 0.08, "sigma": 0.07, "R0": 2.5},
    "Tuberculosis":     {"beta": 0.40, "gamma": 0.05, "sigma": 0.02, "R0": 8.0},
    "Pneumonia":        {"beta": 0.30, "gamma": 0.14, "sigma": 0.20, "R0": 2.1},
    "Hepatitis B":      {"beta": 0.15, "gamma": 0.04, "sigma": 0.03, "R0": 3.8},
    "Common Cold":      {"beta": 0.50, "gamma": 0.25, "sigma": 0.33, "R0": 2.0},
    "Chicken pox":      {"beta": 0.60, "gamma": 0.10, "sigma": 0.20, "R0": 6.0},
    "Gastroenteritis":  {"beta": 0.45, "gamma": 0.22, "sigma": 0.50, "R0": 2.0},
    "Cholera":          {"beta": 0.55, "gamma": 0.16, "sigma": 0.50, "R0": 3.4},
}

DEFAULT_SEIR = {"beta": 0.30, "gamma": 0.12, "sigma": 0.20, "R0": 2.5}


class SEIRModel:
    """
    SEIR Compartmental Model with district-level mobility matrix.
    Supports: basic SEIR, time-varying β (intervention scenarios), mobility spread.
    """

    def __init__(self, disease: str = "Dengue"):
        self.disease = disease
        params = SEIR_PARAMS.get(disease, DEFAULT_SEIR)
        self.beta = params["beta"]     # infection rate
        self.gamma = params["gamma"]   # recovery rate
        self.sigma = params["sigma"]   # incubation rate (E → I)
        self.R0 = params["R0"]

    # ── SINGLE DISTRICT SEIR ──────────────────────────────────
    def simulate(
        self,
        population: int,
        initial_infected: int,
        days: int = 90,
        intervention_day: Optional[int] = None,
        intervention_reduction: float = 0.5,
    ) -> List[Dict]:
        """
        Simulate SEIR for one district.
        intervention_day: day when β is reduced (e.g. lockdown, vaccination)
        intervention_reduction: fraction by which β is reduced
        """
        N = population
        E0 = max(1, initial_infected // 3)
        I0 = initial_infected
        R0_init = 0
        S0 = N - E0 - I0 - R0_init

        S, E, I, R = float(S0), float(E0), float(I0), float(R0_init)
        results = [{"day": 0, "S": int(S), "E": int(E), "I": int(I), "R": int(R), "new_cases": I0}]

        for day in range(1, days + 1):
            beta = self.beta
            if intervention_day and day >= intervention_day:
                beta = self.beta * (1 - intervention_reduction)

            # SEIR differential equations (Euler method)
            dS = -beta * S * I / N
            dE = beta * S * I / N - self.sigma * E
            dI = self.sigma * E - self.gamma * I
            dR = self.gamma * I

            S = max(0.0, S + dS)
            E = max(0.0, E + dE)
            I = max(0.0, I + dI)
            R = max(0.0, R + dR)
            new_cases = max(0, int(self.sigma * E))

            results.append({
                "day": day,
                "S": int(S),
                "E": int(E),
                "I": int(I),
                "R": int(R),
                "new_cases": new_cases,
            })

        return results

    def peak_info(self, simulation: List[Dict]) -> Dict:
        """Extract peak infection stats from simulation output."""
        peak_row = max(simulation, key=lambda x: x["I"])
        total_infected = simulation[-1]["R"]
        attack_rate = total_infected / max(
            simulation[0]["S"] + simulation[0]["I"] + simulation[0]["E"], 1
        )
        return {
            "peak_day": peak_row["day"],
            "peak_infected": peak_row["I"],
            "total_infected_final": total_infected,
            "attack_rate_pct": round(attack_rate * 100, 2),
            "days_to_resolution": next(
                (r["day"] for r in simulation if r["I"] < 10 and r["day"] > 10),
                simulation[-1]["day"],
            ),
        }

    # ── MULTI-DISTRICT MOBILITY MODEL ────────────────────────
    def simulate_with_mobility(
        self,
        districts: List[Dict],
        initial_infected_map: Dict[str, int],
        days: int = 60,
        mobility_rate: float = 0.01,  # 1% daily inter-district movement
    ) -> Dict[str, List[Dict]]:
        """
        Simulate SEIR across multiple districts with mobility-driven spread.
        Infected individuals in district A can seed infections in district B.
        """
        states: Dict[str, Dict] = {}
        for d in districts:
            name = d["name"]
            pop = d.get("population", 1_000_000)
            I0 = initial_infected_map.get(name, 1)
            E0 = max(1, I0 // 3)
            states[name] = {
                "S": float(pop - E0 - I0),
                "E": float(E0),
                "I": float(I0),
                "R": 0.0,
                "N": float(pop),
            }

        histories: Dict[str, List[Dict]] = {d["name"]: [] for d in districts}
        for d in districts:
            histories[d["name"]].append({
                "day": 0, **{k: int(v) for k, v in states[d["name"]].items() if k != "N"}
            })

        for day in range(1, days + 1):
            new_states = {}
            for d in districts:
                name = d["name"]
                st = states[name]
                S, E, I, R, N = st["S"], st["E"], st["I"], st["R"], st["N"]

                # Local transmission
                dS = -self.beta * S * I / N
                dE = self.beta * S * I / N - self.sigma * E
                dI = self.sigma * E - self.gamma * I
                dR = self.gamma * I

                # Mobility seeding from other districts
                total_mobile_infected = sum(
                    states[other["name"]]["I"] * mobility_rate
                    for other in districts if other["name"] != name
                )
                seed_cases = min(S * 0.001, total_mobile_infected * 0.01)
                dS -= seed_cases
                dE += seed_cases

                new_states[name] = {
                    "S": max(0.0, S + dS),
                    "E": max(0.0, E + dE),
                    "I": max(0.0, I + dI),
                    "R": max(0.0, R + dR),
                    "N": N,
                }
                histories[name].append({
                    "day": day,
                    "S": int(new_states[name]["S"]),
                    "E": int(new_states[name]["E"]),
                    "I": int(new_states[name]["I"]),
                    "R": int(new_states[name]["R"]),
                })

            states = new_states

        return histories


# Singleton factory
def get_seir_model(disease: str) -> SEIRModel:
    return SEIRModel(disease)
