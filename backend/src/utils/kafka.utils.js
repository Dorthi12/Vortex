import { producer } from "../config/kafka.js";

export const connectProducer = async () => {
  await producer.connect();
  console.log("Kafka Producer Connected");
};

export const sendKafkaMessage = async (topic, payload) => {
  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(payload),
      },
    ],
  });
};
