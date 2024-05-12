import React from 'react';
import './App.css';
import {Grid} from "@mui/material";
import {Routing} from "../routes/Routing";
import i18n from "../locales/i18n";
import {I18nextProvider} from "react-i18next";

function App() {
  return (
      <I18nextProvider i18n={i18n}>
          <Grid item md={12} style={{background: "red", width: "100%", display: "flex", justifyContent: "center"}}>
              <Routing />
          </Grid>
      </I18nextProvider>
  );
}

export default App;
