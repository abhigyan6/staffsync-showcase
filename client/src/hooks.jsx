import {
  useEffect,
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import { api, message } from "./api";
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
export function useResource(url) {
  const { revision } = useApp();
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const seq = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++seq.current;
    setError("");
    try {
      const { data } = await api.get(url);
      if (request === seq.current) setData(data);
    } catch (e) {
      if (request === seq.current) setError(message(e));
    } finally {
      if (request === seq.current) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    setLoading(true);
    refresh();
    return () => {
      seq.current++;
    };
  }, [refresh, revision]);
  return { data, loading, error, refresh };
}
