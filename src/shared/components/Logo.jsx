import logoLight from '../../assets/logo-light.png';
import logoDark from '../../assets/logo-dark.png';
import { useTheme } from '../../theme/ThemeContext';

/**
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} withSlogan — affiche "BUL XAAR, WAAJAL KO." sous le logo.
 */
export default function Logo({ size = 'md', withSlogan = false, className = '' }) {
  const { darkMode } = useTheme();
  const heights = { sm: 'h-5', md: 'h-8', lg: 'h-10' };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <img
        src={darkMode ? logoDark : logoLight}
        alt="MBEUND MI"
        className={`${heights[size]} w-auto object-contain`}
      />
      {withSlogan && (
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-px bg-navy dark:bg-navy-50" />
          <span className="text-xs font-semibold tracking-widest uppercase text-navy dark:text-navy-50">
            Bul Xaar, Waajal Ko.
          </span>
          <span className="w-5 h-px bg-navy dark:bg-navy-50" />
        </div>
      )}
    </div>
  );
}
