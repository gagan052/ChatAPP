import "./uploadProgress.css";

type Props = {
  fileName: string;
  progress: number;
};

const UploadProgress = ({ fileName, progress }: Props) => {
  return (
    <div className="msg own">
      <div className="file-upload-box">
        <p>{fileName}</p>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span>{progress}%</span>
      </div>
    </div>
  );
};

export default UploadProgress;