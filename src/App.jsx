import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Header from "./components/Header/Header";
import Home from "./pages/Home";
import Footer from "./components/Footer/Footer";
import LearnEvents from "./pages/LearnEvents";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn-events" element={<Navigate to="/learn-events/dementia-education" replace />} />
        <Route path="/learn-events/dementia-education" element={<LearnEvents module="education" />} />
        <Route path="/learn-events/training-resources" element={<LearnEvents module="training" />} />
        <Route path="/learn-events/webinars" element={<LearnEvents module="webinars" />} />
        <Route path="/learn-events/events" element={<LearnEvents module="events" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <ScrollToTop />
    </BrowserRouter>
  );
}

export default App;
