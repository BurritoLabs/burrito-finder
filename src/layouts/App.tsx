import { useIsFetching } from "react-query";
import routes from "../routes";
import ErrorBoundary from "../components/ErrorBoundary";
import { useCurrentChain } from "../contexts/ChainsContext";
import Header from "./Header";
import Loading from "../components/Loading";
import s from "./App.module.scss";

const App = () => {
  const { chainID } = useCurrentChain();
  const isFetching = useIsFetching();

  return (
    <section className={s.main} key={chainID}>
      <Header />
      <section className={s.content}>
        <ErrorBoundary>{routes}</ErrorBoundary>
      </section>
      {isFetching > 0 ? (
        <div className={s.loadingOverlay}>
          <Loading />
        </div>
      ) : null}
    </section>
  );
};

export default App;
