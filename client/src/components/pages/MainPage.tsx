import React from 'react';
import styled from 'styled-components';
import { Switch, useRouteMatch, Route, Redirect } from 'react-router-dom';

import ContestDetailsContainer from '../contest/ContestDetailsContainer';
import ChallengeContainer from '../challenge/ChallengeContainer';
import NavBar from '../navBar/NavBar';
import Footer from '../footer/Footer';
import ContestsContainer from '../contest/ContestsContainer';

const MainPage: React.FC = () => {
  const { path } = useRouteMatch();

  return (
    <SMainPage>
      <NavBar />
      <Switch>
        <SMainBody style={{ flex: 1 }}>
          <Route exact path={`${path}/`} component={ContestsContainer} />
          <Route
            exact
            path={`${path}/:slug`}
            component={ContestDetailsContainer}
          />
          <Route
            exact
            path={`${path}/:slug/:slug`}
            component={ChallengeContainer}
          />
          <Redirect to={`${path}/`} />
        </SMainBody>
      </Switch>
      <Footer />
    </SMainPage>
  );
};

const SMainPage = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const SMainBody = styled.div`
  width: 70%;
  margin: auto;
`;

export default MainPage;
