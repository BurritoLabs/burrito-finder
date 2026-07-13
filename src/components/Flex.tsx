import React, { FC, ReactNode } from "react";
import c from "classnames";

const Flex: FC<{ className?: string; children?: ReactNode }> = ({
  className,
  children
}) => <div className={c("flex", className)}>{children}</div>;

export default Flex;
