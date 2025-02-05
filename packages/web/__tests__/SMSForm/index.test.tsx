import React from 'react';
import { shallow, mount } from 'enzyme';
import SMSForm from '../../components/sms-form';

describe('测试SMSForm组件', () => {
  it('1. 成功渲染', () => {
    const wrapper = shallow(<SMSForm onSubmit={() => {}} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('2. 测试onSubmit是否被传入', () => {
    const onSubmit = jest.fn();
    const wrapper = mount(<SMSForm onSubmit={onSubmit} />);
    expect(wrapper.props().onSubmit).toBeDefined();
  });

  it('3. 测试是否渲染出两个input', () => {
    const wrapper = mount(<SMSForm onSubmit={() => {}} />);
    expect(wrapper.find('input').length).toBe(2);
  });
});
