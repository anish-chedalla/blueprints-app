export type ProgramAvailability = {
  status: string | null;
  rolling: boolean | null;
  deadline: string | null;
};

export function isProgramAvailable(
  program: ProgramAvailability,
  now = new Date(),
): boolean {
  if (program.status === "CLOSED") return false;
  if (program.rolling || !program.deadline) return true;
  return new Date(program.deadline).getTime() >= now.getTime();
}
