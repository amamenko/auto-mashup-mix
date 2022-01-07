import BurgerMenu from "../Burger/BurgerMenu";
import { ReactComponent as Logo } from "../../assets/automashup_logo.svg";
import "./Header.css";

const Header = () => {
  return (
    <div className="header">
      <BurgerMenu />
      <a href="/">
        <Logo />
      </a>
    </div>
  );
};

export default Header;
