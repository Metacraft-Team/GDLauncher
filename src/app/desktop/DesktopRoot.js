import React, { useEffect, memo } from 'react';
import { useDidMount } from 'rooks';
import styled from 'styled-components';
import { Switch } from 'react-router';
import { ipcRenderer } from 'electron';
import { useSelector, useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { message } from 'antd';
import RouteWithSubRoutes from '../../common/components/RouteWithSubRoutes';
import {
  loginWithAccessToken,
  initManifests,
  loginThroughNativeLauncher,
  switchToFirstValidAccount,
  checkClientToken,
  updateUserData,
  loginWithOAuthAccessToken,
  updateServerMetaData
} from '../../common/reducers/actions';
import {
  load,
  received,
  requesting
} from '../../common/reducers/loading/actions';
import features from '../../common/reducers/loading/features';
import GlobalStyles from '../../common/GlobalStyles';
import RouteBackground from '../../common/components/RouteBackground';
import ga from '../../common/utils/analytics';
import routes from './utils/routes';
import { _getCurrentAccount } from '../../common/utils/selectors';
import { isLatestJavaDownloaded, isLocalJava17Exist } from './utils';
import SystemNavbar from './components/SystemNavbar';
import useTrackIdle from './utils/useTrackIdle';
import { openModal } from '../../common/reducers/modals/actions';
import Message from './components/Message';
import { ACCOUNT_MICROSOFT } from '../../common/utils/constants';
import { metaCraftServerCheck } from '../../common/api';
import { useAutomaticSetupJava } from '../../common/hooks';

const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
`;

const Container = styled.div`
  position: absolute;
  top: ${props => props.theme.sizes.height.systemNavbar}px;
  height: calc(100vh - ${props => props.theme.sizes.height.systemNavbar}px);
  width: 100vw;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
  transition-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);
  will-change: transform;
`;

function DesktopRoot({ store }) {
  const dispatch = useDispatch();
  const currentAccount = useSelector(_getCurrentAccount);
  const clientToken = useSelector(state => state.app.clientToken);
  const java17Path = useSelector(state => state.settings.java.path17);
  const location = useSelector(state => state.router.location);
  const shouldShowDiscordRPC = useSelector(state => state.settings.discordRPC);

  message.config({
    top: 45,
    maxCount: 1
  });

  const getMetaData = () => {
    metaCraftServerCheck()
      .then(async result => {
        console.log('metaCraftServerCheck: ', result);
        const metaData = await dispatch(updateServerMetaData(result.data));
        console.log('metaData: ', metaData);
        return metaData;
      })
      .catch(error => {
        console.error('get metaData failed: ', error);
      });
  };

  const init = async () => {
    const userDataStatic = await ipcRenderer.invoke('getUserData');
    const userData = dispatch(updateUserData(userDataStatic));
    await dispatch(checkClientToken());

    const manifests = await dispatch(initManifests());

    let isJava17Valid = java17Path;

    const isLocalJava17Valid = await isLocalJava17Exist();

    if (!java17Path && !isLocalJava17Valid) {
      ({ isValid: isJava17Valid } = await isLatestJavaDownloaded(
        manifests,
        userData,
        true,
        17
      ));
    }

    if (!isLocalJava17Valid && !isJava17Valid) {
      dispatch(openModal('JavaSetup', { preventClose: true }));

      // Super duper hacky solution to await the modal to be closed...
      // Please forgive me
      await new Promise(resolve => {
        function checkModalStillOpen(state) {
          return state.modals.find(v => v.modalType === 'JavaSetup');
        }

        let currentValue;
        const unsubscribe = store.subscribe(() => {
          const previousValue = currentValue;
          currentValue = store.getState().modals.length;
          if (previousValue !== currentValue) {
            const stillOpen = checkModalStillOpen(store.getState());

            if (!stillOpen) {
              unsubscribe();
              return resolve();
            }
          }
        });
      });
    }

    if (process.env.NODE_ENV === 'development' && currentAccount) {
      dispatch(push('/home'));
    } else if (currentAccount) {
      dispatch(
        // TODO: 本地检测到有account，需要调用服务端接口，验证登录态。 替换成新接口
        load(features.mcAuthentication, dispatch(loginWithAccessToken()))
      ).catch(async () => {
        const accountId = await dispatch(switchToFirstValidAccount());
        if (accountId) {
          dispatch(push('/home'));
        }
      });
    }

    if (shouldShowDiscordRPC) {
      ipcRenderer.invoke('init-discord-rpc');
    }

    ipcRenderer.on('custom-protocol-event', (e, data) => {
      console.log(data);
    });

    getMetaData();
  };

  useDidMount(init);

  useEffect(() => {
    if (!currentAccount) {
      dispatch(push('/'));
    }
  }, [currentAccount]);

  // useEffect(() => {
  //   if (clientToken && process.env.NODE_ENV !== 'development') {
  //     ga.setUserId(clientToken);
  //     ga.trackPage(location.pathname);
  //   }
  // }, [location.pathname, clientToken]);

  // useTrackIdle(location.pathname);

  return (
    <Wrapper>
      <SystemNavbar />
      <Message />
      <Container>
        <GlobalStyles />
        <RouteBackground />
        <Switch>
          {routes.map((route, i) => (
            <RouteWithSubRoutes key={i} {...route} /> // eslint-disable-line
          ))}
        </Switch>
      </Container>
    </Wrapper>
  );
}

export default memo(DesktopRoot);
