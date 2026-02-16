import express from "express";
import cors from "cors";
import accountRoutes from "./routes/account.js";
import cookieParser from "cookie-parser";
import loginRoute from "./routes/login.js";
import logoutRoute from "./routes/logout.js";
import fetchLast30HourlyAvgCons from "./routes/fetchLast30HourlyAvgCons.js";
import fetchActualConsPercent from "./routes/fetchActualConsPercent.js";
import fetchActualConsPrice from "./routes/fetchActualConsPrice.js";
import fetchMC from "./routes/fetchMC.js";
import fetchHCons from "./routes/fetchHCons.js";
import fetchMDaywiseCons from "./routes/fetchMDaywiseCons.js";
import fetchTariffBasedConsumption from "./routes/fetchTariffBasedConsumption.js";
import meRoute from "./routes/me.js";
import fetchMCA from "./routes/fetchMCA.js";
import fetchHMHourlyConsumption from "./routes/fetchHMHourlyConsumption.js";

const app = express();

const PORT = 4000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true               
  })
);

app.use('/api', loginRoute);
app.use('/api', accountRoutes);
app.use('/api', logoutRoute);
app.use('/api', fetchLast30HourlyAvgCons);
app.use('/api', fetchActualConsPercent);
app.use('/api', fetchActualConsPrice);
app.use('/api', fetchMC);
app.use('/api', fetchHCons);
app.use('/api', fetchMDaywiseCons);
app.use('/api', fetchTariffBasedConsumption);
app.use('/api', meRoute);
app.use('/api', fetchMCA);
app.use('/api', fetchHMHourlyConsumption);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
