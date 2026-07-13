export const isTnsName = (name: string) => {
  const baseNames = ["ust"];

  return baseNames.some(baseName => {
    const suffix = `.${baseName}`;
    return (
      !name.startsWith(".") && !name.includes("..") && name.endsWith(suffix)
    );
  });
};
