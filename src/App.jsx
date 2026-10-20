import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

import ProjectServices from "./pages/ProjectServices";
import Home from "./pages/Home";
import LearnEvents from "./pages/LearnEvents";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import UnderstandDementia from "./pages/UnderstandDementia";
import CaregiverSupport from "./pages/CaregiverSupport";
import AboutProject from "./pages/AboutProject";

/* FIND HELP & SUPPORT */
import FindHelp from "./pages/find-help/FindHelp";
import AssessmentHealthcare from "./pages/find-help/AssessmentHealthcare";
import SupportServices from "./pages/find-help/SupportServices";
import GovernmentFinancial from "./pages/find-help/GovernmentFinancial";
import EquipmentPractical from "./pages/find-help/EquipmentPractical";
import ResourceFinder from "./pages/find-help/ResourceFinder";

/* Trainer Portal */
import AccountForm from "./trainer-portal/AccountForm";
import TrainerProvider from "./trainer-portal/TrainerContext";
import TrainerLayout from "./trainer-portal/TrainerLayout";
import TrainerDashboard from "./trainer-portal/pages/Dashboard";
import MyProfile from "./trainer-portal/pages/MyProfile";
import TrainerActivities from "./trainer-portal/pages/Activities";
import Conducted from "./trainer-portal/pages/Conducted";
import Hours from "./trainer-portal/pages/Hours";

/* Admin Dashboard */
import AdminLayout from "./admin/AdminLayout";
import AdminOverview from "./admin/pages/Overview";
import ReviewQueue from "./admin/pages/ReviewQueue";
import Records from "./admin/pages/Records";
import Users from "./admin/pages/Users";
import Contribution from "./admin/pages/Contribution";

// The Admin Dashboard is a back-office area, so it hides the public site header and footer.
function PublicOnly({ children }) {
  const { pathname } = useLocation();
  return pathname.startsWith("/admin") || pathname.startWith("/trainer-portal") ? null : children;
}

function App() {
  return (
    <BrowserRouter>
      <PublicOnly>
      <Header />
      </PublicOnly>
      <TrainerProvider>

        <Routes>
          <Route path="/get-updated" element={<ProjectServices />} />
          <Route path="/caregiver-support/verify-certificate" element={<ProjectServices certificate />} />
          <Route path="/trainer-portal/application" element={<main className="tp-page"><div className="tp-container"><AccountForm application /></div></main>} />
          <Route path="/trainer-portal/signup" element={<main className="tp-page"><div className="tp-container"><AccountForm signup /></div></main>} />
          <Route path="/admin/signup" element={<main className="tp-page"><div className="tp-container"><AccountForm role="admin" signup /></div></main>} />
          <Route path="/about/contact" element={<Contact />} />
          <Route path="/contact" element={<Navigate to="/about/contact" replace />} />
          {/* =========================
              HOME
          ========================== */}

          <Route
            path="/"
            element={<Home />}
          />


          {/* =========================
              UNDERSTANDING DEMENTIA
          ========================== */}
          <Route 
            path="/understand-dementia" 
            element={<UnderstandDementia />} 
          />
          <Route 
            path="/understand-dementia/what-is-dementia" 
            element={<Navigate to="/understand-dementia#overview" replace />} 
          />
          <Route 
            path="/understand-dementia/alzheimers" 
            element={<Navigate to="/understand-dementia#overview" replace />} 
          />
          <Route 
            path="/understand-dementia/signs-and-changes" 
            element={<Navigate to="/understand-dementia#early-signs" replace />}
          />
          <Route 
            path="/understand-dementia/why-changes-matter" 
            element={<Navigate to="/understand-dementia#early-signs" replace />} 
          />
          <Route 
            path="/understand-dementia/medical-advice" 
            element={<Navigate to="/understand-dementia#early-signs" replace />} 
          />
          <Route 
            path="/understand-dementia/healthy-ageing" 
            element={<Navigate to="/understand-dementia#healthy-living" replace />} 
          />

          {/* =========================
             CAREGIVER SUPPORT
          ========================== */}
          <Route 
            path="/caregiver-support" 
            element={<CaregiverSupport />} 
          />
          <Route
            path="/caregiver-support/supporting-someone"
            element={<Navigate to="/caregiver-support#guidance" replace />}
          />
          <Route
            path="/caregiver-support/wellbeing"
            element={<Navigate to="/caregiver-support#guidance" replace />}
          />
          <Route
            path="/caregiver-support/guidance"
            element={<Navigate to="/caregiver-support#guidance" replace />}
          />
          <Route
            path="/caregiver-support/training"
            element={<Navigate to="/caregiver-support#training" replace />}
          />
          <Route
            path="/caregiver-support/certificate-verification"
            element={
              <Navigate
                to="/caregiver-support#certificate-verification"
                replace
              />
            }
          />
          <Route
            path="/caregiver-support/support-groups"
            element={<Navigate to="/caregiver-support#support-groups" replace />}
          />
          <Route
            path="/caregiver-support/volunteer"
            element={<Navigate to="/caregiver-support#volunteer" replace />}
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
                to="/learn-events/online-education"
                replace
              />
            }
          />

          <Route
            path="/learn-events/dementia-education"
            element={
              <Navigate
                to="/learn-events/online-education"
                replace
              />
            }
          />

          <Route
            path="/learn-events/training-resources"
            element={
              <Navigate
                to="/learn-events/physical-education"
                replace
              />
            }
          />

          <Route
            path="/learn-events/webinars"
            element={
              <Navigate
                to="/learn-events/online-education"
                replace
              />
            }
          />

          <Route
            path="/learn-events/online-education"
            element={
              <LearnEvents module="online-education" />
            }
          />

          <Route
            path="/learn-events/physical-education"
            element={
              <LearnEvents module="physical-education" />
            }
          />

          <Route
            path="/learn-events/events"
            element={
              <LearnEvents module="events" />
            }
          />

          <Route
            path="/learn-events/certified-trainers"
            element={
              <LearnEvents module="certified-trainers" />
            }
          />

          <Route
            path="/learn-events/upcoming-calendar"
            element={
              <LearnEvents module="upcoming-calendar" />
            }
          />

          {/* =========================
              About the Project
          ========================== */}

          <Route
            path="/about"
            element={<AboutProject />}
          />

          {/* =========================
              TRAINER PORTAL
          ========================== */}

          <Route path="/trainer-portal" element={<TrainerLayout />}>
            <Route index element={<TrainerDashboard />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="activities" element={<TrainerActivities />} />
            <Route path="conducted" element={<Conducted />} />
            <Route path="hours" element={<Hours />} />
          </Route>

{/* =========================
    ADMIN DASHBOARD
========================== */}

<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminOverview />} />
  <Route path="review" element={<ReviewQueue />} />
  <Route path="contribution" element={<Contribution />} />
  <Route path="activities" element={<TrainerActivities admin />} />
  <Route path="conducted" element={<Conducted admin />} />
  <Route path="records" element={<Records />} />
  <Route path="users" element={<Users />} />
</Route>

          {/* =========================
              NOT FOUND
          ========================== */}

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </TrainerProvider>
      <PublicOnly>
      <Footer />
      </PublicOnly>
      <ScrollToTop />
    </BrowserRouter>
  );
}

export default App;
