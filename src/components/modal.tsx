import { type PropsWithChildren, type FC } from "react";
import { View } from "react-native";
import RNModal from "react-native-modal";

import { createStyles } from "utils/theme";

interface Props {
  isVisible: boolean;
  onClose: () => void;
}
export const Modal: FC<PropsWithChildren<Props>> = ({ isVisible, onClose, children }) => {
  const s = useStyles();
  return (
    <RNModal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={s.root}
    >
      <View style={s.content}>{children}</View>
    </RNModal>
  );
};

const useStyles = createStyles((t) => ({
  root: {
    justifyContent: "flex-end",
    margin: 0,
  },
  content: {
    backgroundColor: t.colors.background,
    borderTopLeftRadius: t.border.radius.lg * 2,
    borderTopRightRadius: t.border.radius.lg * 2,
    maxHeight: "80%",
    paddingBottom: t.spacing.lg * 2,
  },
}));
