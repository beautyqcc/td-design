import React from 'react';
import { Form, Input, Button, Icon, message } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { auth, validation } from '@td-design/utils';
import lscache from 'lscache'

const FormItem = Form.Item;
const { password_min, password_max } = auth.getParams();

export interface LoginFormProps extends FormComponentProps {
  phone?: boolean; //true为手机号登录，false为用户名登录
  onSubmit: () => void; //登录成功的回调函数
}

const LoginForm: React.FC<LoginFormProps> = ({ form, phone, onSubmit }) => {
  const { getFieldDecorator } = form;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.validateFields(async (err, values) => {
      if (!err) {
        const result = phone ? await auth.passwordLoginWithPhone(values) : await auth.passwordLoginWithUsername(values);
        if (result.success) {
          lscache.set('access_token',result.result.access_token);
          onSubmit();
        }else{
          message.error(`登录失败:${result.msg}`);
        }
      }
    });
  };
  return (
    <Form onSubmit={handleSubmit}>
      {phone ? (
        <FormItem>
          {getFieldDecorator('phone', {
            rules: [
              {
                required: true,
                message: '请输入手机号码',
              },
              {
                validator: validation.phoneValidator,
              },
            ],
          })(<Input placeholder="请输入手机号码"  prefix={<Icon type="mobile"  style={{ color: 'rgba(0,0,0,.25)' }} />}/>)}
        </FormItem>
      ) : (
        <FormItem>
          {getFieldDecorator('username', {
            rules: [
              {
                required: true,
                message: '请输入用户名',
              },
            ],
          })(<Input placeholder="请输入用户名"  prefix={<Icon type="user"  style={{ color: 'rgba(0,0,0,.25)' }} />}/>)}
        </FormItem>
      )}

      <FormItem>
        {getFieldDecorator('password', {
          rules: [
            {
              required: true,
              message: '请输入密码',
            },
            {
              min: password_min,
              message: `密码长度不能小于${password_min}`,
            },
            {
              max: password_max,
              message: `密码长度不能大于${password_max}`,
            },
          ],
        })(<Input placeholder={`请输入${password_min}-${password_max}位密码`} type="password" prefix={<Icon type="unlock"  style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
      </FormItem>

      <FormItem>
        <Button style={{ width: '100%' }} type="primary" htmlType="submit">
          登录
        </Button>
      </FormItem>
    </Form>
  );
};

export default Form.create<LoginFormProps>()(LoginForm);
