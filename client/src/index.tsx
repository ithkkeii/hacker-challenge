import React from 'react';
import ReactDOM from 'react-dom';
import {
  createHttpLink,
  InMemoryCache,
  ApolloProvider,
  ApolloClient,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { theme } from './theme/theme';
import { getJwt, getCurrentUser } from './services/authService';
import App from './App';
import * as serviceWorker from './serviceWorker';
import 'antd/dist/antd.css';
import { isSignedInVar } from './graphql/localState';

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = getJwt();
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: token || '',
    },
  };
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        isSignedIn: {
          read: () => isSignedInVar(),
        },
      },
    },
    // todo: remove
    UserDto: {
      fields: {
        userTokenDecode: {
          read: getCurrentUser,
        },
      },
    },
  },
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache,
});

library.add(fab, fas, far);

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
