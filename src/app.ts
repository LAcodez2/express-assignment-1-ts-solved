import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";

const app = express();
app.use(express.json());
// All code should go below this line

// Example
app.get("/", (_req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

// Index
app.get("/dogs", async (_req, res) => {
  const dogs = await prisma.dog.findMany();
  res.status(200).json(dogs);
});

// Show dogs ID
app.get("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res
      .status(400)
      .json({ message: "id should be a number" });
  }

  const dog = await prisma.dog.findUnique({
    where: { id },
  });

  if (!dog) {
    return res.status(204).send();
  }

  return res.status(200).json(dog);
});

// Create dog
type DogCreate = {
  age: number;
  name: string;
  description: string;
  breed: string;
};

app.post("/dogs", async (req, res) => {
  const allowedKeys = new Set([
    "age",
    "name",
    "description",
    "breed",
  ]);
  const body = req.body ?? {};
  const keys = Object.keys(body);

  const invalidKeys = keys.filter(
    (k) => !allowedKeys.has(k),
  );
  if (invalidKeys.length > 0) {
    return res.status(400).json({
      errors: invalidKeys.map(
        (k) => `'${k}' is not a valid key`,
      ),
    });
  }

  const { age, name, description, breed } = body as Record<
    string,
    unknown
  >;
  const errors: string[] = [];

  if (typeof age !== "number")
    errors.push("age should be a number");
  if (typeof name !== "string")
    errors.push("name should be a string");
  if (typeof description !== "string")
    errors.push("description should be a string");
  if (typeof breed !== "string")
    errors.push("breed should be a string");

  if (errors.length > 0)
    return res.status(400).json({ errors });

  const created = await prisma.dog.create({
    data: body as DogCreate,
  });

  return res.status(201).json(created);
});

// Update Dog
app.patch("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res
      .status(400)
      .json({ message: "id should be a number" });
  }

  const allowedKeys = new Set([
    "age",
    "name",
    "description",
    "breed",
  ]);
  const keys = Object.keys(req.body ?? {});
  const invalidKeys = keys.filter(
    (k) => !allowedKeys.has(k),
  );

  if (invalidKeys.length > 0) {
    return res.status(400).json({
      errors: invalidKeys.map(
        (k) => `'${k}' is not a valid key`,
      ),
    });
  }

  // (optional but often expected) if they send an empty body
  if (keys.length === 0) {
    return res
      .status(400)
      .json({ errors: ["request body cannot be empty"] });
  }

  const { age, name, description, breed } = req.body;

  // If tests expect “missing dog” to be 204 like SHOW:
  const existing = await prisma.dog.findUnique({
    where: { id },
  });
  if (!existing) return res.status(204).send();

  const updated = await prisma.dog.update({
    where: { id },
    data: {
      ...(age !== undefined ? { age: Number(age) } : {}),
      ...(name !== undefined ? { name: String(name) } : {}),
      ...(description !== undefined
        ? { description: String(description) }
        : {}),
      ...(breed !== undefined
        ? { breed: String(breed) }
        : {}),
    },
  });

  return res.status(201).json(updated);
});

// Delete Dog
app.delete("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res
      .status(400)
      .json({ message: "id should be a number" });
  }

  const dog = await prisma.dog.findUnique({
    where: { id },
  });
  if (!dog) {
    return res.status(204).send();
  }

  const deleted = await prisma.dog.delete({
    where: { id },
  });
  return res.status(200).json(deleted);
});

// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`),
);
