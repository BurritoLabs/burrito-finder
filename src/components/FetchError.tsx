import React, { useEffect } from "react";
import NotFound from "./NotFound";
import { reportClientError } from "../reportError";

type Props = {
  url: string;
  error?: Error;
};

const FetchError = ({ url, error }: Props) => {
  useEffect(() => {
    if (error) reportClientError("fetch", error);
  }, [error]);

  const pathArray = url.split("/");
  const keyword = pathArray[pathArray.length - 1];
  return <NotFound keyword={keyword} />;
};

export default FetchError;
