import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from "../../lib/Mail";

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { subscription } = data;

    await Mail.sendMail({
      to: `${subscription.meetup.user.name} <${subscription.meetup.user.email}>`,
      subject: 'Nova inscrição de meetup',
      template: 'subscription',
      context: {
        meetup: subscription.meetup,
        user: subscription.user.name,
        date: format(parseISO(subscription.meetup.date_hour), "'dia' dd 'de' MMMM', às' H:mm'h'", { locale: pt })
      }
    });
  }
}

export default new SubscriptionMail();
