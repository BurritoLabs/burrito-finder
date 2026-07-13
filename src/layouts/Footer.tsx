import { Link } from "react-router-dom";
import { useCurrentChain } from "../contexts/ChainsContext";
import s from "./Footer.module.scss";

const Footer = () => {
  const { name } = useCurrentChain();

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <span>Burrito Finder</span>
        <nav aria-label="Legal">
          <Link to={`/${name}/privacy`}>Privacy</Link>
          <Link to={`/${name}/terms`}>Terms</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
