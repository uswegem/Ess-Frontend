import { configureStore } from "@reduxjs/toolkit";
import countReducer from "./slice/count";
import userReducer from "./slice/userInfo";

export const store = configureStore({
  reducer: {
    count: countReducer,
    userinfo: userReducer,

  },
});
