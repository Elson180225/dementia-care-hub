import { createContext, useContext, useMemo, useReducer } from "react";
import { sampleAccessRequests, sampleActivities, sampleProfile } from "./mockData";

const TrainerContext = createContext(null);

const initial = {
  session: null,
  adminSession: null,
  profile: sampleProfile,
  activities: sampleActivities,
  accessRequests: sampleAccessRequests,
  history: [],
};

function patchActivity(state, id, fn) {
  return { ...state, activities: state.activities.map((a) => (a.id === id ? fn(a) : a)) };
}

function logEntry(state, entity, entityLabel, decision, comment) {
  return [
    {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      by: "RCBC Admin",
      entity, entityLabel, decision, comment,
    },
    ...state.history,
  ];
}

function reducer(state, action) {
  switch (action.type) {
    case "SIGN_IN":
      return { ...state, session: { id: state.profile.id } };
    case "SIGN_OUT":
      return { ...state, session: null };
    case "ADMIN_SIGN_IN":
      return { ...state, adminSession: { name: "RCBC Admin" } };
    case "ADMIN_SIGN_OUT":
      return { ...state, adminSession: null };

    case "PROFILE_SUBMIT":
      return { ...state, profile: { ...state.profile, ...action.values, status: "submitted", adminComment: "" } };

    case "ACTIVITY_SAVE": {
      const exists = state.activities.some((a) => a.id === action.activity.id);
      if (exists) return patchActivity(state, action.activity.id, (a) => ({ ...a, ...action.activity }));
      return {
        ...state,
        activities: [
          ...state.activities,
          { role: "Trainer", ...action.activity, status: "draft", adminComment: "", completion: { status: "none" } },
        ],
      };
    }
    case "ACTIVITY_SUBMIT":
      return patchActivity(state, action.id, (a) => ({ ...a, status: "submitted", adminComment: "" }));
    case "COMPLETION_SAVE":
      return patchActivity(state, action.id, (a) => ({
        ...a, completion: { ...a.completion, ...action.values, status: "draft" },
      }));
    case "COMPLETION_SUBMIT":
      return patchActivity(state, action.id, (a) => ({
        ...a, completion: { ...a.completion, status: "submitted", adminComment: "" },
      }));

    // Admin decision: approved | returned | rejected. Every decision is logged.
    case "ADMIN_REVIEW": {
      const { target, id, decision, comment = "" } = action;

      if (target === "access") {
        const req = state.accessRequests.find((r) => r.id === id);
        return {
          ...state,
          accessRequests: state.accessRequests.map((r) =>
            r.id === id ? { ...r, status: decision, adminComment: comment } : r
          ),
          history: logEntry(state, "Access request", req?.name ?? "", decision, comment),
        };
      }

      if (target === "profile")
        return {
          ...state,
          profile: { ...state.profile, status: decision, adminComment: comment },
          history: logEntry(state, "Trainer profile", state.profile.name, decision, comment),
        };

      const act = state.activities.find((a) => a.id === id);

      if (target === "activity")
        return {
          ...patchActivity(state, id, (a) => ({ ...a, status: decision, adminComment: comment })),
          history: logEntry(state, "Workshop / Seminar", act?.title ?? "", decision, comment),
        };

      return {
        ...patchActivity(state, id, (a) => ({
          ...a,
          completion: {
            ...a.completion,
            status: decision === "approved" ? "verified" : "returned",
            adminComment: comment,
          },
        })),
        history: logEntry(
          state, "Completed activity record", act?.title ?? "",
          decision === "approved" ? "verified" : decision, comment
        ),
      };
    }

    default:
      return state;
  }
}

export default function TrainerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <TrainerContext.Provider value={value}>{children}</TrainerContext.Provider>;
}

export function useTrainer() {
  const context = useContext(TrainerContext);
  if (!context) throw new Error("useTrainer must be used inside TrainerProvider");
  return context;
}