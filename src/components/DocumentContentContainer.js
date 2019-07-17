import React, { Component } from 'react';

import FileIcon from './FileIcon';
import ShortcutIcon from './ShortcutIcon';
import CustomIcon from './CustomIcon';

import github from '../assets/images/github.ico';
import linkedin from '../assets/images/linkedin.png';
import pdficon from '../assets/images/pdficon.png';

class DocumentContentContainer extends Component {
  render() {
    const { openEmailAlert } = this.props;
    return ( 
      <div>
        <ul style={{display: "inline-flex"}}>
          <li>
            <ShortcutIcon 
              title="Github"
              image={github}
              hrefValue="https://github.com/vineetkoppalkar"
            />
          </li>
          <li>
            <ShortcutIcon 
              title="LinkedIn"
              image={linkedin}
              hrefValue="https://www.linkedin.com/in/vineetkoppalkar/"
            />
          </li>
          <li>
            <CustomIcon 
              title="Resume.pdf"
              image={pdficon}
              onClick={() => alert("Resume")}
              isShortcut={false}
            />
          </li>
          <li>
            <FileIcon 
              title="E-mail.exe"
              image="mail"
              onClick={() => openEmailAlert()}
            />
          </li>
        </ul>
      </div>
    );
  }
}

export default DocumentContentContainer;