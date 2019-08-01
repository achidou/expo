import * as React from 'react'
import { findNodeHandle, ViewProps } from 'react-native';

import {
  TakingPictureOptions,
  Picture,
  VideoRecordingOptions,
  Video,
  FocusPoint,
  Facing,
  FlashMode,
  Autofocus,
  WhiteBalance,
  MountError,
} from './ExpoCamera2.types';

import ExpoNativeCameraView from './ExpoCamera2NativeView';
import ExpoCamera2ViewManager from './ExpoCamera2NativeViewManager';

import UnavailabilityError from './UnavailabilityError';

interface ExpoCamera2ViewProps extends ViewProps {
  /**
   * State of camera autofocus.
   * @default Autofocus.Off
   */
  autofocus?: Autofocus;

  /**
   * Camera facing.
   * @default Facing.Back
   */
  facing?: Facing;

  /**
   * Camera flash mode.
   * @default FlashMode.Off
   */
  flashMode?: FlashMode;

  /**
   * Distance to plane of sharpest focus.
   * Value between `0.0` and `1.0`.
   * `0.0` - infinity focus.
   * `1.0` - focus as close as possible.
   * @Android This is available only for some devices.
   * @default 0.0
   */
  focusDepth?: number;

  /**
   * Camera white balance.
   * @default WhiteBalance.Auto
   */
  whiteBalance?: WhiteBalance;

  /**
   * Value between `0.0` and `1.0` being a percentage of device's max zoom.
   * `0.0` - not zoomed.
   * `1.0` - maximum zoom.
   * @default 0.0
   */
  zoom?: number;

  /**
   * Callback invoked when camera preview has been set.
   */
  onCameraReady?: () => void;

  /**
   * Callback invoked when camera preview could not been started.
   */
  onMountError?: (error: MountError) => void;
}

/**
 * TODO: ensure MVP example is working one!
 * Example:
 * ```ts
 * import * as React from 'react';
 * import { View, Test, StyleSheet } from 'react-native';
 * import * as Camera from 'um-camera';
 *
 * interface State {
 *   permissionsGranted?: boolean;
 *   takingPhoto: boolean;
 *   takenPicture?: any;
 * }
 *
 * class CameraComponent extends React.Component<{}, State> {
 *   readonly state: State = {
 *     takingPhoto: false;
 *   };
 *
 *   componentDidMount() {
 *     this.askForPermissions();
 *   }
 *
 *   async askForPermissions() {
 *     const { status } = await Permissions.askAsync(Permissions.CAMERA);
 *     this.setState({ permissionsGranted: status === Permissions.Granted });
 *   }
 *
 *   async handleTakingPhoto() {
 *   }
 *
 *   render () {
 *     const { permissionsGranted } = this.state;
 *     if (!permissionsGranted) {
 *        return (
 *          <View style={styles.container}>
 *          </View>
 *        )
 *     }
 *
 *     return (
 *       <View styles={{ flex: 1 }}>
 *         <Camera.View styles={{ flex: 1 }}/>
 *         <View styles={{ }}>
 *           <Button onPress={this.handleTakingPhoto}/>
 *         </View>
 *       <View/>
 *     )
 *   }
 * }
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *   },
 *   cameraView: {
 *   },
 *   optionsView: {
 *   },
 *   takingPictureButton: {
 *   },
 * });
 * ```
 */
export default class ExpoCamera2View extends React.Component<ExpoCamera2ViewProps> {
  static defaultProps = {
    autofocus: Autofocus.Off,
    facing: Facing.Back,
    flashMode: FlashMode.Off,
    focusDepth: 0.0,
    whiteBalance: WhiteBalance.Auto,
    zoom: 0.0,
    onCameraReady: () => {},
    onMountError: () => {},
  }

  /**
   * Native node handle that is used to invoke methods on ViewManager.
   */
  cameraNodeHandle?: number;

  /**
   * Pauses the camera view.
   * TODO: is any operation permitted in this state?
   */
  @ensureAvailable
  pausePreviewAsync(): Promise<void> {
    return ExpoCamera2ViewManager.pausePreviewAsync(this.cameraNodeHandle);
  }

  /**
   * Resumes previously pasued preview.
   */
  @ensureAvailable
  resumePreviewAsync(): Promise<void> {
    return ExpoCamera2ViewManager.resumePreviewAsync(this.cameraNodeHandle);
  }

  /**
   * Takes a picture and saves it to app's cache directory.
   * Photos are rotated to match device's orientation (on Android only if **options.skipProcessing** flag is not enabled) and scaled to match the preview.
   * TODO: Anyway on Android it is essential to set ratio prop to get a picture with correct dimensions.
   *
   * > Resulting local image URI is temporary.
   * > Use **Expo.FileSystem.copyAsync** to make a permanent copy of the image.
   */
  @ensureAvailable
  takePictureAsync(options: TakingPictureOptions = {}): Promise<Picture> {
    return ExpoCamera2ViewManager.takePictureAsync(options, this.cameraNodeHandle);
  }

  /**
   * Starts recording a video that will be saved to cache directory.
   * Videos are rotated to match device's orientation.
   * Resulting promise is returned either if:
   * - **stopRecording** method was invoked
   * - one of **maxDuration** aor **maxFileSize** is reached
   * - TODO: or camera preview is stopped (what about **pausePreviewAsync** method?)
   *
   * TODO: Flipping camera during a recording results in stopping it?
   *
   * > Resulting video URI is temporary.
   * > Use **Expo.FileSystem.copyAsync** to make a permanent copy of the video.
   */
  @ensureAvailable
  recordAsync(options: VideoRecordingOptions = {}): Promise<Video> {
    return ExpoCamera2ViewManager.recordAsync(options, this.cameraNodeHandle);
  }

  /**
   * Stops recording if any is in progress.
   */
  @ensureAvailable
  stopRecordingAsync(): Promise<void> {
    return ExpoCamera2ViewManager.stopRecordingAsync(this.cameraNodeHandle);
  }

  /**
   * Get aspect ratios that are supported by the device.
   * @Android only
   */
  @ensureAvailable
  getAvailableRatiosAsync(): Promise<string[]> {
    return ExpoCamera2ViewManager.getAvailableRatiosAsync(this.cameraNodeHandle);
  }

  /**
   * Get picture sizes that are supported by the device for given ratio.
   * Returned list varies across **Android** devices but is the same for every **iOS**.
   */
  @ensureAvailable
  getAvailablePictureSizesAsync(ratio: string): Promise<string[]> {
    return ExpoCamera2ViewManager.getAvailablePictureSizesAsync(ratio, this.cameraNodeHandle);
  }

  /**
   * Tries to focus camera device on given point.
   * Efect is temporary and upon any device movement might be discarded.
   */
  @ensureAvailable
  focusOnPoint(previewFocusPoint: FocusPoint): Promise<boolean> {
    return ExpoCamera2ViewManager.focusOnPoint(previewFocusPoint, this.cameraNodeHandle);
  }

  setNativeReference(ref: React.Component | null) {
    if (ref) {
      const cameraNodeHandle = findNodeHandle(ref)
      if (cameraNodeHandle) {
        this.cameraNodeHandle = cameraNodeHandle
      }
    } else {
      this.cameraNodeHandle = undefined;
    }
  }

  render() {
    return (
      <ExpoNativeCameraView
        {...this.props}
        ref={this.setNativeReference}
      />
    )
  }
}

function ensureAvailable<T extends Function>(
  target: Object,
  propertyName: keyof typeof ExpoCamera2ViewManager,
  descriptor: TypedPropertyDescriptor<T>,
) {
  const method = descriptor.value;
  // @ts-ignore
  descriptor.value = function(...args: any[]) {
    if (!ExpoCamera2ViewManager[propertyName]) {
      throw new UnavailabilityError('Camera', propertyName);
    }
    return method!.apply(this, args);
  }
  return descriptor;
}