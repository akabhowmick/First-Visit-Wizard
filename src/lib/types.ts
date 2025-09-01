export type ComponentKey = "ABOUT_ME" | "ADDRESS" | "BIRTHDATE";

export const ALL_COMPONENTS: ComponentKey[] = [
  "ABOUT_ME",
  "ADDRESS",
  "BIRTHDATE",
];

export type ConfigPayload = {
  step2: ComponentKey[];
  step3: ComponentKey[];
};
