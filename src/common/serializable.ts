abstract class Serializable {
  abstract serialize(): string;
  abstract deserialize(data: string): void;
}
