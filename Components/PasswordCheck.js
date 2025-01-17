console.log('requiring PasswordCheck.js')
import React, { PropTypes } from 'react'
import {
  View,
  Image,
  Dimensions,
  StyleSheet
} from 'react-native'

import BackgroundImage from './BackgroundImage'
import ENV from '../utils/env'
import TimerMixin from 'react-timer-mixin'
import reactMixin from 'react-mixin'

import PasswordGesture from 'react-native-gesture-password'
import utils from '../utils/utils'
var MIN_LENGTH = 5
var Password1 = ''
var BG_IMAGE = ENV.brandBackground
var MODES = {
  check: 'check',
  set: 'set'
}

var PasswordCheck = React.createClass({
  propTypes: {
    validate: PropTypes.func.isRequired,
    promptInvalid: PropTypes.string.isRequired,
    // whether the user already has a password
    // and is choosing a new one
    isChange: PropTypes.bool,
    isCorrect: PropTypes.func,
    onSuccess: PropTypes.func,
    onFail: PropTypes.func,
    maxAttempts: PropTypes.number,
    promptSet: PropTypes.string,
    promptCheck: PropTypes.string,
    promptReenter: PropTypes.string,
    promptReenterChange: PropTypes.string,
    promptRetrySet: PropTypes.string,
    promptRetryCheck: PropTypes.string,
    successMsg: PropTypes.string,
    failMsg: PropTypes.string,
    mode: function (props, propName) {
      return props[propName] in MODES ? null : new Error('Invalid mode')
    }
  },

  getDefaultProps: function () {
    return {
      validate: () => true,
      maxAttempts: Infinity
    }
  },

  getInitialState: function() {
    var state
    if (this.props.mode === MODES.check) {
      var message = this.props.isChange
        ? this.props.promptCheckCurrent
        : this.props.promptCheck

      return {
        status: 'normal',
        message: message,
        attempts: 0
      }
    } else {
      var message = this.props.isChange
        ? this.props.promptSetChange
        : this.props.promptSet

      return {
        status: 'normal',
        message: message,
        attempts: 0
      }
    }
  },

  _onStart: function () {
    this.doSetState({ status: 'normal' })
  },

  _onEntered: function (password) {
    switch (this.props.mode) {
      case MODES.check:
        return this._checkPassword(password)
      case MODES.set:
        return this._setPassword(password)
    }
  },

  _setPassword: function (password) {
    if (this.state.attempts === 0) {
      if (!this.props.validate(password)) {
        return this.doSetState({
          message: this.props.promptInvalid,
          status: 'wrong'
        })
      }

      var message = this.props.isChange
        ? this.props.promptReenterChange
        : this.props.promptReenter

      return this.doSetState({
        message: message,
        attempts: 1,
        password: password,
        status: 'normal'
      })
    }

    if (this.state.password === password) {
      this.doSetState({
        status: 'right',
        message: ''
      })

      return this.props.onSuccess(password)
    }

    this.doSetState({
      attempts: 0,
      status: 'wrong',
      message: this.props.promptRetrySet
    })
  },

  doSetState: function (state) {
    this.setState(state)
    clearTimeout(this._resetToNormalTimeout)
    if (state.status === 'wrong') {
      this._resetToNormalTimeout = this.setTimeout(() => {
        if (this.state.status !== 'normal') {
          this.doSetState({ status: 'normal' })
        }
      }, 1500)
    }
  },

  componentWillUnmount() {
    clearTimeout(this._resetToNormalTimeout)
  },

  _checkPassword: function (password) {
    if (!this.props.validate(password)) {
      return this.doSetState({
        status: 'wrong',
        message: this.props.promptInvalid
      })
    }

    this.props.isCorrect(password)
      .then((isCorrect) => {
        if (isCorrect) {
          this.doSetState({
            status: 'right',
            message: this.props.successMsg
          })

          return this.props.onSuccess()
        }

        if (++this.state.attempts >= this.props.maxAttempts) {
          this.doSetState({
            status: 'wrong',
            attempts: this.state.attempts,
            message: this.props.failMsg
          })

          return this.props.onFail()
        }

        this.doSetState({
          status: 'wrong',
          attempts: this.state.attempts,
          message: this.props.promptRetryCheck
        })
      })
      .done()
  },

  render: function() {
    return (
      <View style={styles.container}>
        <BackgroundImage source={BG_IMAGE} />
        <PasswordGesture
          lockToPortrait={true}
          ref='pg'
          shell={true}
          nucleus={true}
          styles={
            {
              frame: containerRawStyle,
              msgText: { fontSize: utils.getFontSize(26) },
              line: { height: 2, backgroundColor: '#ffffff' }
            }
          }
          baseColor={'#ffffff'}
          rightColor={'#FAF7AC'}
          wrongColor={'#F794AB'}
          radius={{ inner: 18, outer: 25 }}
          status={this.state.status}
          message={this.state.message}
          msgStyle={{fontSize:24}}
          onStart={() => this._onStart()}
          onEnd={(password) => this._onEntered(password)}
        />
      </View>
    )
  }
})
reactMixin(PasswordCheck.prototype, TimerMixin)

PasswordCheck.displayName = 'PasswordCheck'
PasswordCheck.orientation = 'PORTRAIT'
module.exports = PasswordCheck

var containerRawStyle = {
  backgroundColor: 'transparent',
  flex: 1,
  alignSelf: 'stretch'
}

var styles = StyleSheet.create({
  container: containerRawStyle
})

module.exports.displayName = 'PasswordCheck'
module.exports.Modes = MODES
