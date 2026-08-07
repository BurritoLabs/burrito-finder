(() => {
  try {
    const saved = localStorage.getItem("burrito:theme");
    const preference = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    const theme = preference === "system"
      ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : preference;
    const root = document.documentElement;
    root.dataset.themePreference = preference;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#070D0B" : "#F5F8F5");
  } catch (_) {
    document.documentElement.dataset.themePreference = "system";
    document.documentElement.dataset.theme = "dark";
  }
})();
