import type {
  AuthContext,
  ManifestResponse,
  RemoteAppProps,
  RemoteLoaderProps,
  Role,
} from '../index';

const assertTypes = (
  _auth: AuthContext | null,
  _manifest: ManifestResponse | null,
  _remoteProps: RemoteLoaderProps | null,
  _remoteAppProps: RemoteAppProps | null,
  _role: Role | null,
) => ({
  _auth,
  _manifest,
  _remoteProps,
  _remoteAppProps,
  _role,
});

void assertTypes(null, null, null, null, null);
