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

import Home from "./pages/Home";
import {
  LiveEducation as LearnEvents,
  Directory,
  LearningResources,
  Subscribe,
  CertificateVerification,
  ActivityLanding,
  TrainerPublicProfile,
  ContentPage,
} from "./shared/PublicRecords";
import { AuthProvider } from "./auth/AuthContext";
import Login from "./auth/Login";
import AdminDashboard from "./admin/AdminDashboard";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import AboutProject from "./pages/AboutProject";

/* FIND HELP & SUPPORT */
import FindHelp from "./pages/find-help/FindHelp";

/* Trainer Portal */
import TrainerProvider from "./trainer-portal/TrainerContext";
import TrainerLayout from "./trainer-portal/TrainerLayout";
import TrainerDashboard from "./trainer-portal/pages/Dashboard";
import MyProfile from "./trainer-portal/pages/MyProfile";
import TrainerActivities from "./trainer-portal/pages/Activities";
import Conducted from "./trainer-portal/pages/Conducted";
import Hours from "./trainer-portal/pages/Hours";

function PublicHeader() {
  return useLocation().pathname.startsWith("/admin") ? null : <Header />;
}
function PublicFooter() {
  return useLocation().pathname.startsWith("/admin") ? null : <Footer />;
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PublicHeader />

        <Routes>
          <Route path="/admin/login" element={<Login admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/get-updated" element={<Subscribe />} />
          <Route path="/learning-resources" element={<LearningResources />} />
          <Route
            path="/certificate-verification"
            element={<CertificateVerification />}
          />
          <Route path="/activities/:id" element={<ActivityLanding />} />
          <Route path="/trainers/:id" element={<TrainerPublicProfile />} />
          <Route
            path="/support-groups"
            element={
              <Directory
                kind={["support_group", "ngo"]}
                title="Support Groups & Volunteer"
              />
            }
          />
          <Route
            path="/caregiver-support/*"
            element={
              <ContentPage section="caregiver" title="Caregiver Support" />
            }
          />
          <Route
            path="/understand-dementia/*"
            element={
              <ContentPage
                section="understanding"
                title="Understanding Dementia"
              />
            }
          />
          <Route
            path="/faqs"
            element={
              <ContentPage section="faq" title="Frequently Asked Questions" />
            }
          />
          <Route path="/about/contact" element={<Contact />} />
          <Route
            path="/contact"
            element={<Navigate to="/about/contact" replace />}
          />
          {/* =========================
            HOME
        ========================== */}

          <Route path="/" element={<Home />} />

          {/* =========================
            FIND HELP & SUPPORT
        ========================== */}

          <Route path="/find-help" element={<FindHelp />} />

          <Route
            path="/find-help/assessment-healthcare"
            element={
              <Directory
                kind="healthcare_provider"
                title="Assessment & Healthcare"
              />
            }
          />

          <Route
            path="/find-help/support-services"
            element={<Directory title="Support Services Directory" />}
          />

          <Route
            path="/find-help/government-financial"
            element={
              <Directory
                kind={["government", "financial"]}
                title="Government & Financial Resources"
              />
            }
          />

          <Route
            path="/find-help/equipment-practical"
            element={
              <Directory
                kind={["equipment", "supplier"]}
                title="Equipment & Practical Resources"
              />
            }
          />

          <Route
            path="/find-help/resource-finder"
            element={<Directory title="Resource Finder" />}
          />

          {/* =========================
            LEARN & EVENTS
        ========================== */}

          <Route
            path="/learn-events"
            element={<Navigate to="/learn-events/online-education" replace />}
          />

          <Route
            path="/learn-events/dementia-education"
            element={<Navigate to="/learn-events/online-education" replace />}
          />

          <Route
            path="/learn-events/training-resources"
            element={<Navigate to="/learn-events/physical-education" replace />}
          />

          <Route
            path="/learn-events/webinars"
            element={<Navigate to="/learn-events/online-education" replace />}
          />

          <Route
            path="/learn-events/online-education"
            element={<LearnEvents module="online-education" />}
          />

          <Route
            path="/learn-events/physical-education"
            element={<LearnEvents module="physical-education" />}
          />

          <Route
            path="/learn-events/events"
            element={<LearnEvents module="events" />}
          />

          <Route
            path="/learn-events/certified-trainers"
            element={<LearnEvents module="certified-trainers" />}
          />

          <Route
            path="/learn-events/upcoming-calendar"
            element={<LearnEvents module="upcoming-calendar" />}
          />

          {/* =========================
            About the Project
        ========================== */}

          <Route path="/about" element={<AboutProject />} />

          {/* =========================
            TRAINER PORTAL
        ========================== */}

          <Route
            path="/trainer-portal"
            element={
              <TrainerProvider>
                <TrainerLayout />
              </TrainerProvider>
            }
          >
            <Route index element={<TrainerDashboard />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="activities" element={<TrainerActivities />} />
            <Route path="conducted" element={<Conducted />} />
            <Route path="hours" element={<Hours />} />
          </Route>

          {/* =========================
            NOT FOUND
        ========================== */}

          <Route path="*" element={<NotFound />} />
        </Routes>

        <PublicFooter />

        <ScrollToTop />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
