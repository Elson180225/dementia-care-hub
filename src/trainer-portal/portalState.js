const collections=['profiles','activities','accessRequests','history','users','contributions','projectReach','maintenance','records'];
export function normalizePortalState(snapshot,defaults) {
 const state={...defaults,...snapshot};
 for(const key of collections)state[key]=Array.isArray(snapshot?.[key])?snapshot[key]:[];
 return state;
}
