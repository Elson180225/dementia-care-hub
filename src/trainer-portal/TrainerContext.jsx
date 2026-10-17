import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../shared/api";
const TrainerContext = createContext(null);
export default function TrainerProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({
      profile: null,
      activities: [],
      annual: [],
      assets: [],
      documents: [],
      activityAssets: [],
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setError("");
      setState(await api("/trainer/workspace"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (user?.role === "certified_trainer") refresh();
    else setLoading(false);
  }, [user, refresh]);
  return (
    <TrainerContext.Provider value={{ state, loading, error, refresh }}>
      {children}
    </TrainerContext.Provider>
  );
}
export const useTrainer = () => useContext(TrainerContext);
