import React, { useState, useEffect, memo } from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { ipcRenderer } from 'electron';
// import { promises as fs } from 'fs';
// import path from 'path';
import Instances from '../components/Instances';
import { openModal } from '../../../common/reducers/modals/actions';
import {
  _getCurrentAccount
  // _getInstances
} from '../../../common/utils/selectors';
import { extractFace, isLatestJavaDownloaded } from '../utils';
import { updateLastUpdateVersion } from '../../../common/reducers/actions';
import { useAddFabricInstance } from '../../../common/hooks';
import {
  FABRIC,
  MC_VERSION,
  FABRIC_LOADER_VERSION
} from '../../../common/utils/constants';

const AccountContainer = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
`;

const Home = () => {
  const dispatch = useDispatch();
  const account = useSelector(_getCurrentAccount);
  const lastUpdateVersion = useSelector(state => state.app.lastUpdateVersion);
  const userData = useSelector(state => state.userData);
  const java17Path = useSelector(state => state.settings.java.path17);
  const java17Manifest = useSelector(state => state.app.java17Manifest);

  const createInstance = useAddFabricInstance({
    instanceVersion: {
      loaderType: FABRIC,
      loaderVersion: FABRIC_LOADER_VERSION,
      mcVersion: MC_VERSION
    }
  });

  const openAccountModal = () => {
    dispatch(openModal('AccountsManager'));
  };

  const [profileImage, setProfileImage] = useState(null);

  const checkAndInstallJava = async () => {
    const store = window.__store;

    let isJava17Valid = java17Path;
    if (!java17Path) {
      ({ isValid: isJava17Valid } = await isLatestJavaDownloaded(
        { java17: java17Manifest },
        userData,
        true,
        17
      ));
    }

    if (!isJava17Valid) {
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
  };

  useEffect(() => {
    const init = async () => {
      const appVersion = await ipcRenderer.invoke('getAppVersion');
      if (lastUpdateVersion !== appVersion) {
        dispatch(updateLastUpdateVersion(appVersion));
        dispatch(openModal('ChangeLogs'));
      } else if (!java17Path) {
        await checkAndInstallJava();
        createInstance();
      } else {
        createInstance();
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (account && account.skin) {
      extractFace(account.skin).then(setProfileImage).catch(console.error);
    }
  }, [account]);

  return (
    <div>
      <Instances />
      {/* <AddInstanceIcon type="primary" onClick={() => openAddInstanceModal(0)}>
        <FontAwesomeIcon icon={faPlus} />
      </AddInstanceIcon> */}
      <AccountContainer type="primary" onClick={openAccountModal}>
        {profileImage ? (
          <img
            src={`data:image/jpeg;base64,${profileImage}`}
            css={`
              width: 15px;
              cursor: pointer;
              height: 15px;
              margin-right: 10px;
            `}
            alt="profile"
          />
        ) : (
          <div
            css={`
              width: 15px;
              height: 15px;
              background: ${props => props.theme.palette.grey[100]};
              margin-right: 10px;
            `}
          />
        )}
        {account && account.selectedProfile.name}
      </AccountContainer>
    </div>
  );
};

export default memo(Home);
