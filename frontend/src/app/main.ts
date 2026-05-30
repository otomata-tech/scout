import "./index.css";
import { mountShell, isAuthEnabled, isAuthenticated, login } from "@/index";
import { scoutMission } from "./mission";

const PUBLIC_ROUTES = new Set(["/callback"]);

mountShell({
  mission: scoutMission,
  async beforeMount({ router }) {
    router.beforeEach(async (to) => {
      if (!isAuthEnabled()) return true; // dev bypass when LOGTO_* unset
      if (PUBLIC_ROUTES.has(to.path)) return true;
      if (await isAuthenticated()) return true;
      await login(to.fullPath);
      return false;
    });
  },
});
