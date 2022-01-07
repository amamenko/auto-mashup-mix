import { useState } from "react";
import { slide as Menu } from "react-burger-menu";
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../../assets/automashup_logo.svg";
import { ReactComponent as GitHubLogo } from "../../assets/github_logo.svg";
import { ReactComponent as YouTubeLogo } from "../../assets/youtube_logo.svg";
import "./BurgerMenu.css";

const BurgerMenu = () => {
  const [isOpen, changeIsOpen] = useState(false);

  const handleStateChange = (state) => {
    changeIsOpen(state.isOpen);
  };

  const closeMenu = () => changeIsOpen(false);

  return (
    <Menu isOpen={isOpen} onStateChange={(state) => handleStateChange(state)}>
      <Logo />
      <Link onClick={() => closeMenu()} to="/">
        Home
      </Link>
      <Link onClick={() => closeMenu()} to="/privacy">
        Privacy Policy
      </Link>
      <Link onClick={() => closeMenu()} to="/terms">
        Terms of Use
      </Link>
      <div className="bottom_menu_logos">
        <a
          href="https://github.com/amamenko/auto-mashup"
          rel="noopener noreferrer"
        >
          <GitHubLogo />
        </a>
        <a
          href="https://www.youtube.com/channel/UCbjaDBiyXCqWGT4inY8LCmQ"
          rel="noopener noreferrer"
        >
          <YouTubeLogo />
        </a>
      </div>
      <p className="bottom_copyright">
        © {new Date().getFullYear()} Auto Mashup
      </p>
    </Menu>
  );
};

export default BurgerMenu;
