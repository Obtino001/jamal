const fs = require('fs');

let buffer = fs.readFileSync('assets/custom.css');
let utf8Str = buffer.toString('utf8');

// Find where the corrupted text begins by looking for the first null byte after line 76
// Actually, it's easier to just read the original 76 lines and discard the rest.
let lines = utf8Str.split('\n');
let cleanLines = lines.slice(0, 76);

let newCss = cleanLines.join('\n') + `

/* Premium Button Hover Animation */
.button, .button-georg-black, .button-fancy-large, .promo-card__button {
  position: relative;
  overflow: hidden;
  transition: color 0.4s ease, transform 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease !important;
  z-index: 1;
}

.button::after, .button-georg-black::after, .button-fancy-large::after, .promo-card__button::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.08);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: -1;
  transform: scaleX(0);
  transform-origin: right;
}

.button:hover::after, .button-georg-black:hover::after, .button-fancy-large:hover::after, .promo-card__button:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

.button-georg-black::after {
  background: rgba(255, 255, 255, 0.15);
}

.georg-pdp-section .product-form__submit:hover, .georg-pdp-section .button-fancy-large.add-to-cart:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(174, 225, 252, 0.5) !important;
}
`;

fs.writeFileSync('assets/custom.css', newCss, 'utf8');
console.log('Fixed custom.css');
