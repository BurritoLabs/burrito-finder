import { Suspense } from "react";
import AppRoutes from "../routes";
import ErrorBoundary from "../components/ErrorBoundary";
import { useCurrentChain } from "../contexts/ChainsContext";
import Header from "./Header";
import Loading from "../components/Loading";
import Footer from "./Footer";
import s from "./App.module.scss";

const App = () => {
  const { chainID } = useCurrentChain();
  return (
    <section className={s.main} key={chainID}>
      <Header />
      <section className={s.content}>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <AppRoutes />
          </Suspense>
        </ErrorBoundary>
      </section>
      <Footer />
    </section>
  );
};

export default App;
