import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

import Home from "./pages/Home";
import LearnEvents from "./pages/LearnEvents";
import NotFound from "./pages/NotFound";

/* FIND HELP & SUPPORT */
import FindHelp from "./pages/find-help/FindHelp";
import AssessmentHealthcare from "./pages/find-help/AssessmentHealthcare";
import SupportServices from "./pages/find-help/SupportServices";
import GovernmentFinancial from "./pages/find-help/GovernmentFinancial";
import EquipmentPractical from "./pages/find-help/EquipmentPractical";
import ResourceFinder from "./pages/find-help/ResourceFinder";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        {/* =========================
            HOME
        ========================== */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* =========================
            FIND HELP & SUPPORT
        ========================== */}

        <Route
          path="/find-help"
          element={<FindHelp />}
        />

        <Route
          path="/find-help/assessment-healthcare"
          element={<AssessmentHealthcare />}
        />

        <Route
          path="/find-help/support-services"
          element={<SupportServices />}
        />

        <Route
          path="/find-help/government-financial"
          element={<GovernmentFinancial />}
        />

        <Route
          path="/find-help/equipment-practical"
          element={<EquipmentPractical />}
        />

        <Route
          path="/find-help/resource-finder"
          element={<ResourceFinder />}
        />

        {/* =========================
            LEARN & EVENTS
        ========================== */}

        <Route
          path="/learn-events"
          element={
            <Navigate
              to="/learn-events/dementia-education"
              replace
            />
          }
        />

        <Route
          path="/learn-events/dementia-education"
          element={
            <LearnEvents module="education" />
          }
        />

        <Route
          path="/learn-events/training-resources"
          element={
            <LearnEvents module="training" />
          }
        />

        <Route
          path="/learn-events/webinars"
          element={
            <LearnEvents module="webinars" />
          }
        />

        <Route
          path="/learn-events/events"
          element={
            <LearnEvents module="events" />
          }
        />

        {/* =========================
            NOT FOUND
        ========================== */}

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      <Footer />

      <ScrollToTop />
    </BrowserRouter>
  );
}

export default App;