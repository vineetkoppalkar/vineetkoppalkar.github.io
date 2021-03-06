import React, { Component } from 'react';
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { initGA, PageView } from './components/Tracking/Tracking';

import * as windowType from './constants';

import { reset, themes, Button, AppBar, Toolbar, Avatar, Divider } from "react95";
import { Tooltip, Icon } from '@react95/core';

import StartMenu from './components/StartMenu';
import Window from './components/Window';
import DesktopIcons from './components/DesktopIcons';
import DocumentContentContainer from './components/DocumentContentContainer'
import ComputerContentContainer from './components/ComputerContentContainer'
import ProjectsContentContainer from './components/ProjectsContentContainer'
import WelcomeContentContainer from './components/WelcomeContentContainer'
import EmailAlert from './components/EmailAlert';
import TabbedWindow from './components/TabbedWindow';

const ResetStyles = createGlobalStyle`
  ${reset}
`;

const DOCUMENTS_NAME = "Documents"
const DOCUMENTS_ICON = "folder_file"

const COMPUTER_NAME = "Computer"
const COMPUTER_ICON = "computer"

const PROJECTS_NAME = "Projects"
const PROJECTS_ICON = "folder"

const WELCOME_NAME = "Welcome"
const WELCOME_ICON = "user"

const formatAMPM = (date) => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  let strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      curTime: formatAMPM(new Date()),
      showStartMenu: false,
      windows: {},
      windowPositionManager: {},
      taskbarItemWidth: '6em',
      numWindowsOpen: 0
    }
  }

  componentDidMount() {
    initGA('UA-144168371-1');
    PageView(window.location.pathname + window.location.search);
    setInterval( () => {
      this.setState({
        curTime : formatAMPM(new Date())
      })
    }, 30000)
  }

  toggleStartMenu = (value = null) => {
    if (value != null) {
      this.setState({
        showStartMenu: value
      });
    } else {
      let updatedShowStartMenu = !this.state.showStartMenu;
      this.setState({
        showStartMenu: updatedShowStartMenu
      });

      window.ga('send', {
        hitType: 'event',
        eventCategory: "Toggled start menu",
        eventAction: updatedShowStartMenu ? "Opened start menu" : "Closed start menu",
      });
    }
  }

  updatedSelectedWindows = (name, windows) => {
    Object.keys(windows).forEach((key) => {
      if (key === name) { 
        windows[key].isFocused = true;
        console.log("Show " + key + " in front");
      } else {
        console.log("Setting focus of " + key + " to false");
        windows[key].isFocused = false;
      }
    });
    return windows;
  }

  setWindowFocus = (name) => {
    let updatedWindows = this.updatedSelectedWindows(name, this.state.windows);
    this.setState({
      windows: updatedWindows,
      showStartMenu: false
    });
  }

  getWindowPositionIndex = (name, type) => {
    let index = 0;
    const { windowPositionManager } = this.state;

    let windowTypeDict = windowPositionManager[type];
    if (windowTypeDict == null) {
      windowPositionManager[type] = {};
      windowTypeDict = windowPositionManager[type];
    }
    let dictSize = Object.keys(windowTypeDict).length;

    if (dictSize === 0) {
      windowTypeDict[0] = name;
    } else {
      let foundAvailableIndex = false;
      for (let i = 0; i < dictSize; ++i) {
        if (windowTypeDict[i] === null) {
          windowTypeDict[i] = name;
          foundAvailableIndex = true;
          index = i;
          break;
        }
      }
      if (!foundAvailableIndex) {
        windowTypeDict[dictSize] = name;
        index = dictSize;
      }
    }
    return index;
  }

  getTaskBarItemWidth = (numOpenWindows) => {
    if (numOpenWindows >= 9) {
      return "5.25em";
    } else if (numOpenWindows >= 7) {
      return "6em";
    } else if (numOpenWindows > 5) {
      return "7em";
    } else {
      return "8em";
    }
  }

  clearWindowPositionIndex = (name, type) => {
    const { windowPositionManager } = this.state;
    let windowTypeDict = windowPositionManager[type];
    if (windowTypeDict == null || Object.keys(windowTypeDict).length === 0) {
      return windowPositionManager;
    }

    for (let key in windowTypeDict) {
      if (windowTypeDict[key] === name) {
        windowTypeDict[key] = null;
        break;
      }
    }

    return windowPositionManager;
  }

  openWindowHandler = (name, icon, type, content) => {
    let { windows, numWindowsOpen } = this.state;
    if (!(name in windows)) {
      let index = this.getWindowPositionIndex(name, type);

      windows[name] = {
        icon,
        title: name,
        content,
        type,
        isFocused: true,
        index
      };
      
      let updatedWindows = this.updatedSelectedWindows(name, windows);
      let updatedNumWindowsOpen = ++numWindowsOpen;
      let updatedTaskbarItemWidth = this.getTaskBarItemWidth(updatedNumWindowsOpen);

      this.setState({
        windows: updatedWindows,
        showStartMenu: false,
        taskbarItemWidth: updatedTaskbarItemWidth,
        numWindowsOpen: updatedNumWindowsOpen
      });

      window.ga('send', {
        hitType: 'event',
        eventCategory: "Opened window",
        eventAction: name,
      });
      
      console.log("Opened " + name);
    } else {
      this.setWindowFocus(name);
      console.log("Cannot open " + name + " because it is already open");
    }
  }

  closeWindowHandler = (name, type) => {
    let { windows, numWindowsOpen } = this.state;
    if (name in windows) {
      let updatedwindows = windows;
      delete updatedwindows[name];
      let updatedwindowPositionManager = this.clearWindowPositionIndex(name, type);

      let updatedNumWindowsOpen = --numWindowsOpen;
      let updatedTaskbarItemWidth = this.getTaskBarItemWidth(updatedNumWindowsOpen);

      this.setState({
        windows: updatedwindows,
        windowPositionManager: updatedwindowPositionManager,
        showStartMenu: false,
        taskbarItemWidth: updatedTaskbarItemWidth,
        numWindowsOpen: updatedNumWindowsOpen
      });

      window.ga('send', {
        hitType: 'event',
        eventCategory: "Closed window",
        eventAction: name,
      });

      console.log("Closed " + name);
    } else {
      console.log("Cannot close " + name + " because it is not open");
    }
  }

  openDocuments = () => {
    this.openWindowHandler(DOCUMENTS_NAME, DOCUMENTS_ICON, windowType.WINDOW, 
      <DocumentContentContainer 
        openWindowHandler={this.openWindowHandler}
      />
    );
  };

  openComputer = () => {
    this.openWindowHandler(COMPUTER_NAME, COMPUTER_ICON, windowType.WINDOW,
      <ComputerContentContainer 
        openWindowHandler={this.openWindowHandler}
      />
    );
  }

  openProjects = () => {
    this.openWindowHandler(PROJECTS_NAME, PROJECTS_ICON, windowType.TABBED_WINDOW,
      <ProjectsContentContainer />
    );
  }

  openWelcome = () => {
    this.openWindowHandler(WELCOME_NAME, WELCOME_ICON, windowType.TABBED_WINDOW,
      <WelcomeContentContainer 
        doucmentsName={DOCUMENTS_NAME}
        documentsIcon={DOCUMENTS_ICON}
        computerName={COMPUTER_NAME}
        computerIcon={COMPUTER_ICON}   
        projectsName={PROJECTS_NAME}
        projectsIcon={PROJECTS_ICON}
      />
    );
  }

  render() {
    const { showStartMenu, windows, curTime, taskbarItemWidth, numWindowsOpen } = this.state;
    return (
      <div>
        <ResetStyles />
        <DesktopIcons
          documentsIcon={DOCUMENTS_ICON}
          documentsName={DOCUMENTS_NAME}
          openDocuments={this.openDocuments}
          computerIcon={COMPUTER_ICON}
          computerName={COMPUTER_NAME}
          openComputer={this.openComputer}
          projectsIcon={PROJECTS_ICON}
          projectsName={PROJECTS_NAME}
          openProjects={this.openProjects}
          welcomeIcon={WELCOME_ICON}
          welcomeName={WELCOME_NAME}
          openWelcome={this.openWelcome}
        />
        
        {
          Object.keys(windows).map((key) => {
            let { windows } = this.state;
            let currentWindow = windows[key];
            
            switch(currentWindow.type) {
              case windowType.WINDOW:
                return (
                  <Window
                    key={key}
                    icon={currentWindow.icon}
                    title={currentWindow.title}
                    content={currentWindow.content}
                    isFocused={currentWindow.isFocused}
                    closeHandler={this.closeWindowHandler}
                    topValue={(7 * (currentWindow.index + 1)) + "%"}
                    leftValue={(7 * (currentWindow.index + 1)) + "%"}
                    setWindowFocus={this.setWindowFocus}
                  />
                );
              case windowType.ALERT:
                  return (
                    <EmailAlert
                      key={key}
                      icon={currentWindow.icon}
                      title={currentWindow.title}
                      content={currentWindow.content}
                      isFocused={currentWindow.isFocused}
                      closeHandler={this.closeWindowHandler}
                      topValue={(7 * (currentWindow.index + 1)) + "%"}
                      leftValue={(7 * (currentWindow.index + 1)) + "%"}
                      setWindowFocus={this.setWindowFocus}
                    />
                  );
              case windowType.TABBED_WINDOW:
                  return (
                    <TabbedWindow
                      key={key}
                      icon={currentWindow.icon}
                      title={currentWindow.title}
                      content={currentWindow.content}
                      isFocused={currentWindow.isFocused}
                      closeHandler={this.closeWindowHandler}
                      topValue={(7 * (currentWindow.index + 1)) + "%"}
                      leftValue={(7 * (currentWindow.index + 1)) + "%"}
                      setWindowFocus={this.setWindowFocus}
                    />
                  );
              default:
                return null;
            }
          })
        }

        {showStartMenu ? (
          <StartMenu
            toggleStartMenu={this.toggleStartMenu}
            welcomeIcon={WELCOME_ICON}
            welcomeName={WELCOME_NAME}
            openWelcome={this.openWelcome}
            documentsIcon={DOCUMENTS_ICON}
            documentsName={DOCUMENTS_NAME}
            openDocuments={this.openDocuments}
            computerIcon={COMPUTER_ICON}
            computerName={COMPUTER_NAME}
            openComputer={this.openComputer}
            projectsIcon={PROJECTS_ICON}
            projectsName={PROJECTS_NAME}
            openProjects={this.openProjects}
          />
        ) : null}
        
        <ThemeProvider theme={themes.default}>
          <AppBar style={{
            bottom: 0,
            top: 'auto',
          }}>
            <Toolbar style={{ justifyContent: 'space-between', paddingRight: '1rem' }}>
              <div style={{display: "inline-flex"}}>
                {showStartMenu ? (
                  <Button active onClick={() => this.toggleStartMenu()}>
                    <Icon name="logo" /> Start
                  </Button>
                ) : (
                  <Button onClick={() => this.toggleStartMenu()}>
                    <Icon name="logo" /> Start
                  </Button>
                )}
                <Divider vertical size="md" style={{marginLeft: "0.5rem", marginRight: "0.5rem"}}/>
                {
                  Object.keys(windows).map((key) => {
                    let window = windows[key];
                    if (window.isFocused) {
                      return (
                        <Button 
                          active
                          key={key} 
                          style={{width: taskbarItemWidth}}
                          onClick={() => {
                            this.updatedSelectedWindows(key, windows);
                            this.toggleStartMenu(false)
                          }}
                        >
                          {numWindowsOpen <= 5 ? (
                            <Icon 
                              name={window.icon} 
                              style={{
                                width: "20%",
                                marginRight: "5px"
                              }}
                            />
                          ) : null}
                          {key}
                        </Button>
                      );
                    } else { 
                      return (
                        <Button 
                          key={key} 
                          style={{width: taskbarItemWidth}}
                          onClick={() => {
                            this.updatedSelectedWindows(key, windows);
                            this.toggleStartMenu(false)
                          }}
                        >
                          {numWindowsOpen <= 5 ? (
                            <Icon 
                              name={window.icon} 
                              style={{
                                width: "20%",
                                marginRight: "5px"
                              }}
                            />
                          ) : null}
                          {key}
                        </Button>
                      );
                    }
                  })
                }
              </div>
              <Tooltip text={curTime} delay={100}>
                <Avatar square style={{width: 'auto', padding: "10px"}}>{curTime}</Avatar>
              </Tooltip>
            </Toolbar>
          </AppBar>
        </ThemeProvider>
      </div>
    );
  }
}

export default App;
