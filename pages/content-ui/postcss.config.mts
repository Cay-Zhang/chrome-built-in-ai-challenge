import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import remToResponsivePixel from 'postcss-rem-to-responsive-pixel';

export default {
  plugins: [
    postcssImport(),
    tailwindcss(),
    autoprefixer(),
    remToResponsivePixel({
      rootValue: 16,
      propList: ['*'],
      transformUnit: 'px',
    }),
  ],
};
