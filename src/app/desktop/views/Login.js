import React, { useState, useEffect, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ipcRenderer } from 'electron';
import styled from 'styled-components';
import { Transition } from 'react-transition-group';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExternalLinkAlt,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { Button, Space } from 'antd';
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
import leftSideBg from '../../../common/assets/left-side-bg.svg';
import formatAddress from '../../../common/utils/formatAddress';

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
  cursor: pointer;

  > img {
    margin-right: 8px;
    width: 50px;
    height: 50px;
    object-fit: cover;
  }
`;

/** login & cancel button */
const BaseButton = styled(Button)`
  width: 400px;
  height: 56px;
  color: #fff !important;
  border-radius: 15px;
  font-size: 18px;
  line-height: 24px;
  font-weight: bold;
  border: none !important;
`;

const ButtonGroup = styled(Space)`
  width: 100%;
`;

const MetamaskLoginButton = styled(BaseButton)`
  position: relative;
  margin-top: 60px;
  width: 400px;
  height: 56px;
  background: ${props => props.theme.palette.blue[500]} !important;

  svg {
    position: absolute;
    width: 16px;
    height: 16px;
    top: 18px;
    right: 24px;
  }
`;

const LoginButton = styled(BaseButton)`
  background: ${props => props.theme.palette.blue[500]} !important;
`;

const CancelButton = styled(BaseButton)`
  background: ${props => props.theme.palette.colors.orange} !important;
`;

/** account informations  */
const AccountInfoContainer = styled(Space)`
  width: 100%;
  margin: 40px 0 32px 0;
`;

const AccountInfoLabel = styled.div`
  margin-bottom: 8px;
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.175px;
  color: #f8f8f8;
  opacity: 0.65;
`;

const AccountInfoContent = styled.div`
  width: 400px;
  height: 48px;
  padding: 0 20px;
  background: #293649;
  border-radius: 15px;
  font-weight: 500;
  font-size: 16px;
  line-height: 48px;
  letter-spacing: 0.2px;
  color: #f8f8f8;
`;

const HelpLink = styled.div`
  margin-top: 32px;
  display  block;
  text-align: center;
  font-size: 16px;
  line-height: 20px;
  color: #f8f8f8;
  cursor: pointer;
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
  overflow-y: auto;
  transition: 0.3s ease-in-out;
  transform: translateX(
    ${({ transitionState }) =>
      transitionState === 'entering' || transitionState === 'entered'
        ? -300
        : 0}px
  );
  background: url('${leftSideBg}') 0 0 100% 100% no-repeat;

  p {
    margin-top: 1em;
    color: ${props => props.theme.palette.text.third};
  }
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

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-bottom: 120px;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
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

const Login = () => {
  const dispatch = useDispatch();
  // switch for showing confirm account view
  const [isConfirmAccount, setConfirmAccount] = useState(true);

  // account informations which received from matemask
  const [username, setUsername] = useState(null);
  const [address, setAddress] = useState(null);
  const [params, setParams] = useState(null);

  const [loginFailed, setLoginFailed] = useState(false);

  const loading = useSelector(
    state => state.loading.accountAuthentication.isRequesting
  );

  const openChromeWithMetamask = () => {
    ipcRenderer.invoke('loginWithMetamask');
  };

  useKey(['Enter'], openChromeWithMetamask);

  const handleLogin = useCallback(() => {
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
  }, [dispatch, username, address, params]);

  const handleCancel = useCallback(() => {
    setConfirmAccount(false);
    // clear old account informations
    setParams(null);
    setUsername(null);
    setAddress(null);
  }, [setConfirmAccount, setParams, setUsername, setAddress]);

  useEffect(() => {
    ipcRenderer.on('receive-metamask-login-params', (e, received) => {
      console.log(params, username);
      console.log('authenticate ....');
      setParams(received);
      setAddress(received.address);
      setUsername(received.username);
    });

    return () => {
      ipcRenderer.removeAllListeners('receive-metamask-login-params');
    };
  }, [username, setParams, setAddress, setUsername]);

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
            <Content>
              {isConfirmAccount ? (
                <AccountInfoContainer
                  direction="vertical"
                  align="center"
                  size={14}
                >
                  <div>
                    <AccountInfoLabel>Address</AccountInfoLabel>
                    <AccountInfoContent>
                      {formatAddress(address)}
                    </AccountInfoContent>
                  </div>
                  <div>
                    <AccountInfoLabel>Nickname</AccountInfoLabel>
                    <AccountInfoContent>{username}</AccountInfoContent>
                  </div>
                </AccountInfoContainer>
              ) : null}
              <ButtonGroup direction="vertical" align="center" size={24}>
                {isConfirmAccount ? (
                  <>
                    <LoginButton onClick={handleLogin}>Login</LoginButton>
                    <CancelButton onClick={handleCancel}>Cancel</CancelButton>
                  </>
                ) : (
                  <MetamaskLoginButton
                    color="primary"
                    onClick={openChromeWithMetamask}
                  >
                    Sign in with Metamask
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </MetamaskLoginButton>
                )}
              </ButtonGroup>
              {isConfirmAccount ? null : (
                <HelpLink>
                  How to install and use Metamask?
                  <FontAwesomeIcon
                    css={`
                      margin-left: 6px;
                    `}
                    icon={faInfoCircle}
                  />
                </HelpLink>
              )}
            </Content>
            <Footer>
              <SocialMediaContainer>
                <a
                  href=""
                  css={`
                    -webkit-app-region: no-drag;
                    cursor: pointer;
                  `}
                >
                  <SocialMediaIcon>
                    <img src={whitepaperIcon} alt="whitepaper" />
                    <p>WhitePaper</p>
                  </SocialMediaIcon>
                </a>
                <a
                  href=""
                  css={`
                    -webkit-app-region: no-drag;
                    cursor: pointer;
                  `}
                >
                  <SocialMediaIcon>
                    <img src={twitterIcon} alt="twitter" />
                    <p>Twitter</p>
                  </SocialMediaIcon>
                </a>
                <a
                  href=""
                  css={`
                    -webkit-app-region: no-drag;
                    cursor: pointer;
                  `}
                >
                  <SocialMediaIcon>
                    <img src={discordIcon} alt="discord" />
                    <p>Discord</p>
                  </SocialMediaIcon>
                </a>
                <a
                  href=""
                  css={`
                    -webkit-app-region: no-drag;
                    cursor: pointer;
                  `}
                >
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
