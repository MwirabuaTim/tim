console.log('requiring MyProductMessageRow.js')
'use strict'

import utils from '../utils/utils'
var translate = utils.translate
import ArticleView from './ArticleView'
import NewResource from './NewResource'
import Icon from 'react-native-vector-icons/Ionicons';
import constants from '@tradle/constants'
import RowMixin from './RowMixin'
import equal from 'deep-equal'
import chatStyles from '../styles/chatStyles'

import reactMixin from 'react-mixin'

import {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  Alert,
  Navigator,
  View,
} from 'react-native'

import React, { Component } from 'react'
const MAX_PROPS_IN_FORM = 1

class MyProductMessageRow extends Component {
  constructor(props) {
    super(props);
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !equal(this.props.resource, nextProps.resource) ||
           !equal(this.props.to, nextProps.to)
  }

  render() {
    var { resource, application, to, bankStyle } = this.props;
    if (resource[constants.TYPE] === 'tradle.MyTaxesFiledConfirmation')
      return <View/>
    var model = utils.getModel(resource[constants.TYPE] || resource.id);
    var renderedRow = [];

    let isMyMessage
    // Check if the provider that issued the MyProduct is the same as the one that
    // the chat user currently viewing it. If not that means that this MyProduct was shared
    // by user
    let isReadOnlyChat = utils.isReadOnlyChat(to)
    if (!application  &&  resource.from.organization  &&  !isReadOnlyChat) {
      if (utils.getId(resource.from.organization) !== utils.getId(to))
        isMyMessage = true
    }
    var ret = this.formatRow(isMyMessage, renderedRow);
    let onPressCall = ret ? ret.onPressCall : null

    let addStyle = [chatStyles.verificationBody, {backgroundColor: bankStyle.productBgColor , borderColor: bankStyle.confirmationColor}];
    // let rowStyle = [chatStyles.row,  {backgroundColor: bankStyle.backgroundColor}];
    var val = this.getTime(resource);
    var date = val
             ? <Text style={chatStyles.date} numberOfLines={1}>{val}</Text>
             : <View />;

    // var viewStyle = {flexDirection: 'row', alignSelf: 'flex-start', width: DeviceWidth - 50};

    var hdrStyle = {backgroundColor: '#289427'} //bankStyle.productBgColor ? {backgroundColor: bankStyle.productBgColor} : {backgroundColor: '#289427'}
    var orgName = resource.from.organization  ? resource.from.organization.title : ''

    var w = utils.dimensions(MyProductMessageRow).width
    let msgWidth = Math.min(Math.floor(w * 0.8), 600)
    if (isReadOnlyChat)
      msgWidth -= 50 // provider icon and padding
    let numberOfCharacters = msgWidth / 12
    let issuedBy = translate('issuedBy', orgName)
    if (issuedBy.length > numberOfCharacters)
      issuedBy = issuedBy.substring(0, numberOfCharacters) + '..'

    renderedRow.splice(0, 0, <View  key={this.getNextKey()} style={[chatStyles.verifiedHeader, hdrStyle, {marginHorizontal: -8, marginTop: -7, marginBottom: 7, paddingBottom: 5}]}>
                               <Text style={styles.issuedBy}>{issuedBy}</Text>
                            </View>
                            );
    let title = translate(model)
    if (title.length > 30)
      title = title.substring(0, 27) + '...'

    renderedRow.push(<Text  key={this.getNextKey()} style={[chatStyles.formType, {color: '#289427'}]}>{title}</Text>);
    let rowStyle = addStyle ? [chatStyles.textContainer, addStyle] : chatStyles.textContainer
    let vStyle = isMyMessage ? styles.viewStyleR : styles.viewStyleL
    let messageBody =
      <TouchableHighlight onPress={onPressCall ? onPressCall : () => {}} underlayColor='transparent'>
        <View style={vStyle}>
          {this.getOwnerPhoto()}
          <View style={rowStyle}>
            <View style={{flex: 1}}>
              {renderedRow}
           </View>
          </View>
        </View>
      </TouchableHighlight>


    var viewStyle = { margin: 1, paddingTop: 7} //, backgroundColor: bankStyle.BACKGROUND_COLOR }
    return (
      <View style={viewStyle} key={this.getNextKey()}>
        {date}
        {messageBody}
      </View>
    );
  }

  onPress(event) {
    this.props.navigator.push({
      id: 7,
      component: ArticleView,
      passProps: {url: this.props.resource.message}
    });
  }

  formatRow(isMyMessage, renderedRow) {
    var resource = this.props.resource;
    var model = utils.getModel(resource[constants.TYPE] || resource.id);

    var viewCols = model.gridCols || model.viewCols;
    if (!viewCols)
      return {onPressCall: this.props.onSelect.bind(this, resource, null)}
    var first = true;
    var self = this;

    var properties = model.properties;
    var noMessage = !resource.message  ||  !resource.message.length;
    var onPressCall;

    var cnt = 0;
    var self = this

    var vCols = [];
    viewCols.forEach(function(v) {
      if (properties[v].type === 'array'  ||  properties[v].type === 'date')
        return;

      if (properties[v].ref) {
        if (resource[v]) {
          vCols.push(self.getPropRow(properties[v], resource, resource[v].title || resource[v]))
          first = false;
        }
        return;
      }
      var style = chatStyles.description; //resourceTitle; //(first) ? styles.resourceTitle : styles.description;
      if (isMyMessage)
        style = [style, {justifyContent: 'flex-end', color: '#2892C6'}];

      if (resource[v]                      &&
          properties[v].type === 'string'  &&
          (resource[v].indexOf('http://') == 0  ||  resource[v].indexOf('https://') == 0)) {
        onPressCall = self.onPress.bind(self);
        vCols.push(<Text style={style} numberOfLines={first ? 2 : 1} key={self.getNextKey()}>{resource[v]}</Text>);
      }
      else if (!model.autoCreate) {
        var val = (properties[v].displayAs)
                ? utils.templateIt(properties[v], resource)
                : properties[v].type === 'boolean' ? (resource[v] ? 'Yes' : 'No') : resource[v];

        if (!val)
          return
        if (model.properties.verifications  &&  !isMyMessage)
          onPressCall = self.verify.bind(self);
        if (!isMyMessage)
          style = [style, {paddingBottom: 10, color: '#2892C6'}];
        vCols.push(self.getPropRow(properties[v], resource, val))
      }
      else {
        if (!resource[v]  ||  !resource[v].length)
          return
        let isConfirmation = resource[v].indexOf('Congratulations!') !== -1

        if (isConfirmation) {
          style = [style, {color: self.props.bankStyle.confirmationColor, fontSize: 18}]
          vCols.push(
            <View key={self.getNextKey()}>
              <Text style={[style]}>{resource[v]}</Text>
              <Icon style={[{color: self.props.bankStyle.confirmationColor}, styles.flower]} size={50} name={'ios-flower'} />
              <Icon style={{color: self.props.bankStyle.confirmationColor}, styles.done} size={30} name={'ios-done-all'} />
            </View>
          );

        }
        else
          vCols.push(<Text style={style} key={self.getNextKey()}>{resource[v]}</Text>);
      }
      first = false;

    });
    if (vCols  &&  vCols.length) {
      if (vCols.length > MAX_PROPS_IN_FORM)
        vCols.splice(MAX_PROPS_IN_FORM, 1)
      vCols.forEach((v) => {
        renderedRow.push(v);
      })
    }
    if (onPressCall)
      return {onPressCall: onPressCall}
    return {onPressCall: this.props.onSelect.bind(this, resource, null)}
  }
}

var styles = StyleSheet.create({
  viewStyleL: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginRight: 50
  },
  viewStyleR: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    marginLeft: 50
  },
  issuedBy: {
    fontSize: 18,
    alignSelf: 'center',
    color: '#fff'
  },
  flower: {
    alignSelf: 'flex-end',
    width: 50,
    height: 50,
    marginTop: -45,
    opacity: 0.2
  },
  done: {
    alignSelf: 'flex-end',
    marginTop: -10
  }
});
reactMixin(MyProductMessageRow.prototype, RowMixin);

module.exports = MyProductMessageRow;

