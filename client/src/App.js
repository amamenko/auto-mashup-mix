import { Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Privacy from "./routes/Privacy/Privacy";
import Home from "./routes/Home/Home";
import "./index.css";
import Terms from "./routes/Terms/Terms";

const App = () => {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </div>
  );
};

export default App;
