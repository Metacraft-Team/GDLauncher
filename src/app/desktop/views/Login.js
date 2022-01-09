import React, { useState, useEffect, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ipcRenderer } from 'electron';
import styled from 'styled-components';
import { Transition } from 'react-transition-group';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExternalLinkAlt,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { Button } from 'antd';
import { useKey } from 'rooks';
import { loginMetamask } from '../../../common/reducers/actions';
import { load } from '../../../common/reducers/loading/actions';
import features from '../../../common/reducers/loading/features';
import backgroundImg from '../../../common/assets/background.png';
import whitepaperIcon from '../../../common/assets/whitepaper.png';
import twitterIcon from '../../../common/assets/twitter.png';
import githubIcon from '../../../common/assets/github.png';
import discordIcon from '../../../common/assets/discord.png';
import metaCraftLogo from '../../../common/assets/metaCraft-logo.svg';
import logoWithoutText from '../../../common/assets/logo.png';

const SocialMediaContainer = styled.div`
  margin-bottom: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-row-gap: 32px;
  grid-column-gap: 120px;
`;

const SocialMediaIcon = styled.div`
  display: flex;
  align-items: center;
  color: #fff;
  font-size: 20px;

  > img {
    margin-right: 8px;
    width: 50px;
    height: 50px;
    object-fit: cover;
  }
`;

const MetamaskLoginButton = styled(Button)`
  position: relative;
  margin-top: 60px;
  width: 400px;
  height: 56px;
  background: ${props => props.theme.palette.blue[500]};
  border-radius: 15px;
  font-size: 18px;
  line-height: 24px;
  font-weight: bold;

  svg {
    position: absolute;
    top: 18px;
    right: 24px;
  }
`;

const HelpLink = styled.div`
  margin-top: 32px;
  display  block;
  text-align: center;
  font-size: 16px;
  line-height: 20px;
  color: #f8f8f8;
`;

const Logo = styled.img`
  width: 140px;
  margin-bottom: 20px;
`;

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
`;

const LeftSide = styled.div`
  position: relative;
  flex: 0 0 600px;
  padding: 20px 40px;
  height: 100%;
  transition: 0.3s ease-in-out;
  transform: translateX(
    ${({ transitionState }) =>
      transitionState === 'entering' || transitionState === 'entered'
        ? -300
        : 0}px
  );
  background: ${props => props.theme.palette.secondary.main};

  p {
    margin-top: 1em;
    color: ${props => props.theme.palette.text.third};
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  margin: 20px 0 !important;
`;

const Background = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  > img {
    transition: 0.3s ease-in-out;
    transform: translateX(
      ${({ transitionState }) =>
        transitionState === 'entering' || transitionState === 'entered'
          ? -300
          : 0}px
    );
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    object-fit: cover;
  }
`;

const Header = styled.div`
  margin-top: 80px !important;
  display: flex;
  flex-direction: columns;
  justify-content: center;
  alig-items: center;
  img {
    width: 160px;
  }
`;

const Footer = styled.div`
  position: absolute;
  bottom: 4px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: calc(100% - 80px);
`;

const Loading = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  z-index: -1;
  justify-content: center;
  backdrop-filter: blur(8px) brightness(60%);
  font-size: 40px;
  transition: 0.3s ease-in-out;
  opacity: ${({ transitionState }) =>
    transitionState === 'entering' || transitionState === 'entered' ? 1 : 0};
`;
const LoginFailMessage = styled.div`
  color: ${props => props.theme.palette.colors.red};
`;

const Login = () => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState(null);
  const [version, setVersion] = useState(null);
  const [loginFailed, setLoginFailed] = useState(false);
  const loading = useSelector(
    state => state.loading.accountAuthentication.isRequesting
  );

  const openChromeWithMetamask = () => {
    ipcRenderer.invoke('loginWithMetamask', { username });
  };

  useKey(['Enter'], openChromeWithMetamask);

  useEffect(() => {
    ipcRenderer.invoke('getAppVersion').then(setVersion).catch(console.error);
  }, []);

  useEffect(() => {
    ipcRenderer.on('receive-metamask-login-params', (e, params) => {
      console.log(params, username);
      console.log('authenticate ....');

      dispatch(
        load(
          features.mcAuthentication,
          dispatch(
            loginMetamask({
              ...params,
              timestamp: Number(params.timestamp),
              username
            })
          )
        )
      ).catch(error => {
        console.error(error);
        setLoginFailed(error);
      });
    });

    return () => {
      ipcRenderer.removeAllListeners('receive-metamask-login-params');
    };
  }, [username]);

  return (
    <Transition in={loading} timeout={300}>
      {transitionState => (
        <Container>
          <LeftSide transitionState={transitionState}>
            <a
              href="https://metacraft.cc/"
              rel="noopener noreferrer"
              css={`
                -webkit-app-region: no-drag;
                cursor: pointer;
              `}
            >
              <Logo
                src={metaCraftLogo}
                alt="Metacraft"
                css="cursor: pointer;"
              />
            </a>
            <Header>
              <a
                href="https://metacraft.cc/"
                rel="noopener noreferrer"
                css={`
                  -webkit-app-region: no-drag;
                  cursor: pointer;
                `}
              >
                <img
                  src={logoWithoutText}
                  alt="Metacraft"
                  css="cursor: pointer;"
                />
              </a>
            </Header>
            <Form>
              <MetamaskLoginButton
                color="primary"
                onClick={openChromeWithMetamask}
              >
                Sign in with Metamask
                <FontAwesomeIcon icon={faExternalLinkAlt} />
              </MetamaskLoginButton>
              <HelpLink>
                How to install and use Metamask?
                <FontAwesomeIcon
                  css={`
                    margin-left: 6px;
                  `}
                  icon={faInfoCircle}
                />
              </HelpLink>
            </Form>
            <Footer>
              <SocialMediaContainer>
                <a href="">
                  <SocialMediaIcon>
                    <img src={whitepaperIcon} alt="whitepaper" />
                    <p>WhitePaper</p>
                  </SocialMediaIcon>
                </a>
                <a href="">
                  <SocialMediaIcon>
                    <img src={twitterIcon} alt="twitter" />
                    <p>Twitter</p>
                  </SocialMediaIcon>
                </a>
                <a href="">
                  <SocialMediaIcon>
                    <img src={discordIcon} alt="discord" />
                    <p>Discord</p>
                  </SocialMediaIcon>
                </a>
                <a href="">
                  <SocialMediaIcon>
                    <img src={githubIcon} alt="github" />
                    <p>Github</p>
                  </SocialMediaIcon>
                </a>
              </SocialMediaContainer>
            </Footer>
          </LeftSide>
          <Background transitionState={transitionState}>
            <img src={backgroundImg} alt="background" />
          </Background>
          <Loading transitionState={transitionState}>Loading...</Loading>
        </Container>
      )}
    </Transition>
  );
};

export default memo(Login);
