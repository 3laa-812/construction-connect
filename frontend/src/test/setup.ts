import "@testing-library/jest-dom/vitest";

/** Radix Select / dialogs use Pointer Capture APIs missing in jsdom */
Element.prototype.hasPointerCapture = function () {
  return false;
};
Element.prototype.setPointerCapture = function () {};
Element.prototype.releasePointerCapture = function () {};

Element.prototype.scrollIntoView = function () {};
