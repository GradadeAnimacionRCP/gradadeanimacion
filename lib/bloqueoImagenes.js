export function activarBloqueoImagenes() {
  if (typeof window === 'undefined') return;

  const bloquearMenu = (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  };
  const bloquearArrastre = (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  };

  document.addEventListener('contextmenu', bloquearMenu);
  document.addEventListener('dragstart', bloquearArrastre);

  return () => {
    document.removeEventListener('contextmenu', bloquearMenu);
    document.removeEventListener('dragstart', bloquearArrastre);
  };
}
