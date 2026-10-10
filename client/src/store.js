import {
  configureStore,
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { api } from "./api";
export const loadSession = createAsyncThunk("auth/load", async () => {
  return (await api.get("/auth/me")).data;
});
const slice = createSlice({
  name: "auth",
  initialState: { user: null, status: "loading" },
  reducers: {
    signedIn: (s, a) => {
      s.user = a.payload;
      s.status = "ready";
    },
    signedOut: (s) => {
      s.user = null;
      s.status = "ready";
    },
  },
  extraReducers: (b) => {
    b.addCase(loadSession.fulfilled, (s, a) => {
      s.user = a.payload;
      s.status = "ready";
    }).addCase(loadSession.rejected, (s) => {
      s.user = null;
      s.status = "ready";
    });
  },
});
export const { signedIn, signedOut } = slice.actions;
export const store = configureStore({ reducer: { auth: slice.reducer } });
