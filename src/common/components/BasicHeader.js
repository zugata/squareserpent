import React from 'react';
import Header from './layout/Header';
import HeaderRow from './layout/HeaderRow';
import ButtonMenu from './controls/ButtonMenu';
import headerPullRight from './layout/headerPullRight';
import LayoutTitle from './layout/LayoutTitle';

const PT = React.PropTypes;

/**
 * Defines the basic header structure for Squareserpent. Custom content is filled
 * in by the params.
 */
export default function BasicHeader({title, menuContent, leftContent, rightContent}) {
  return <Header>
    {/* we don't have a "drawer"/menu right now, so lighten the left pad for now */}
    <HeaderRow style={{paddingLeft: 10}}>
      <ButtonMenu
          buttonIcon='menu'
          flatButton={true}
          buttonStyle={{marginRight: 20}}>
        {menuContent}
      </ButtonMenu>
      <LayoutTitle style={{marginRight: 20}}>
        {title}
      </LayoutTitle>
      {leftContent}
      {headerPullRight(rightContent)}
    </HeaderRow>
  </Header>;
}

BasicHeader.propTypes = {
  title: PT.any.isRequired,
  menuContent: PT.any.isRequired,
  leftContent: PT.any.isRequired,
  rightContent: PT.any.isRequired
};
