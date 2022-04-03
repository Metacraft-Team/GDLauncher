import React, { useState, useEffect, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ipcRenderer } from 'electron';
import styled from 'styled-components';
import { Transition } from 'react-transition-group';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExternalLinkAlt,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { Button, Space } from 'antd';
import { useKey } from 'rooks';
import { loginMetamask } from '../../../common/reducers/actions';
import { load, loginViaETH } from '../../../common/reducers/loading/actions';
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
import { _getCurrentAccount } from '../../../common/utils/selectors';

const SocialMediaContainer = styled.div`
  margin-top: 48px;
  margin-bottom: 20px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-row-gap: 24px;
  grid-column-gap: 60px;
`;

const SocialMediaIcon = styled.div`
  display: flex;
  align-items: center;
  color: #fff;
  font-size: 16px;
  cursor: pointer;

  > img {
    margin-right: 16px;
    width: 50px;
    height: 50px;
    object-fit: cover;
  }
`;

/** login & cancel button */
const BaseButton = styled(Button)`
  width: 100%;
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
  margin-top: 75px;
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
  width: 100%;
  height: 48px;
  padding-left: 12px;
  background: #293649;
  border-radius: 15px;
  font-weight: 500;
  font-size: 16px;
  line-height: 48px;
  letter-spacing: 0.2px;
  color: #f8f8f8;
`;

const HelpLink = styled.a`
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
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 2;
  max-width: 640px;
  padding: 20px 60px;
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

  & .ant-space-item {
    width: 100%;
  }
`;

const Background = styled.div`
  position: relative;
  flex: 3;
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
  const currentUser = useSelector(_getCurrentAccount);
  const dispatch = useDispatch();
  // switch for showing confirm account view
  const [isConfirmAccount, setConfirmAccount] = useState(false);

  // account informations which received from matemask
  const [params, setParams] = useState(null);

  const [setLoginFailed] = useState(false);

  const isGlobalLodingChecking = useSelector(
    state => state.loading.isGlobalLodingChecking
  );
  const loading = useSelector(state => state.loading.isLoginViaEth);

  console.log(isGlobalLodingChecking);

  const openChromeWithMetamask = useCallback(() => {
    ipcRenderer.invoke('loginWithMetamask');
    dispatch(loginViaETH(true));

    return true;
  }, [dispatch]);

  useKey(['Enter'], openChromeWithMetamask);

  const handleLogin = useCallback(() => {
    dispatch(
      load(
        features.mcAuthentication,
        dispatch(
          loginMetamask({
            address: params.checksumAddress,
            username: params.name,
            timestamp: Number(params.timestamp),
            signature: params.signature
          })
        )
      )
    ).catch(error => {
      console.error(error);
      setLoginFailed(error);
    });
  }, [dispatch, params]);

  const handleCancel = useCallback(() => {
    dispatch(loginViaETH(false));
    setConfirmAccount(false);
    // clear old account informations
    setParams(null);
  }, [dispatch, setConfirmAccount, setParams]);

  useEffect(() => {
    ipcRenderer.on('receive-metamask-login-params', (e, received) => {
      console.log('authenticate ....');

      dispatch(loginViaETH(false));
      setParams(received);

      setConfirmAccount(true);
    });

    return () => {
      ipcRenderer.removeAllListeners('receive-metamask-login-params');
    };
  }, [dispatch, setParams]);

  // useEffect(() => {
  //   if (currentUser)
  // }, [currentUser]);

  return (
    <Transition timeout={300}>
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
              <AccountInfoContainer
                direction="vertical"
                align="center"
                size={14}
              >
                {isConfirmAccount ? (
                  <>
                    <div>
                      <AccountInfoLabel>Address</AccountInfoLabel>
                      <AccountInfoContent>
                        {formatAddress(params.address)}
                      </AccountInfoContent>
                    </div>
                    <div>
                      <AccountInfoLabel>Nickname</AccountInfoLabel>
                      <AccountInfoContent>{params.name}</AccountInfoContent>
                    </div>
                  </>
                ) : null}
              </AccountInfoContainer>
              <ButtonGroup direction="vertical" align="center" size={24}>
                {isConfirmAccount ? (
                  <>
                    <LoginButton onClick={handleLogin}>Login</LoginButton>
                    <CancelButton onClick={handleCancel}>Cancel</CancelButton>
                  </>
                ) : (
                  <>
                    <MetamaskLoginButton
                      color="primary"
                      onClick={loading ? () => {} : openChromeWithMetamask}
                    >
                      {loading || isGlobalLodingChecking ? (
                        'authing...'
                      ) : (
                        <>
                          Sign in with Metamask
                          <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </>
                      )}
                    </MetamaskLoginButton>
                    {loading ? (
                      <CancelButton onClick={handleCancel}>Cancel</CancelButton>
                    ) : null}
                  </>
                )}
              </ButtonGroup>
              {isConfirmAccount ? null : (
                <HelpLink href="https://docs.metacraft.cc/guides/how-to-install-and-use-metamask">
                  How to install and use Metamask?
                  <FontAwesomeIcon
                    css={`
                      margin-left: 6px;
                    `}
                    icon={faQuestionCircle}
                  />
                </HelpLink>
              )}
              <HelpLink
                href="https://docs.metacraft.cc/guides/beginners-guide"
                css={`
                  margin-top: 6px;
                `}
              >
                How to play?
                <FontAwesomeIcon
                  css={`
                    margin-left: 6px;
                  `}
                  icon={faQuestionCircle}
                />
              </HelpLink>
            </Content>
            <Footer>
              <SocialMediaContainer>
                <a
                  className="a1"
                  href="https://docs.metacraft.cc/guides"
                  css={`
                    -webkit-app-region: no-drag;
                    cursor: pointer;
                  `}
                >
                  <SocialMediaIcon>
                    <img src={whitepaperIcon} alt="Guides" />
                    <p>Docs</p>
                  </SocialMediaIcon>
                </a>
                <a
                  className="a2"
                  href="https://twitter.com/MetacraftCC"
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
                  className="b1"
                  href="https://discord.com/invite/PvzFHa4QJd"
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
                  className="b2"
                  href="https://github.com/Metacraft-Team"
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
